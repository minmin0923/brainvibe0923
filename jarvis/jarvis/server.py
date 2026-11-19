"""내 컴퓨터 안에서만 열리는 화면 서버 (127.0.0.1). 시작할 때마다 새 접속 열쇠(token)를 만든다."""
from __future__ import annotations

import json
import queue
import re
import secrets
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .config import APP_DIR

UI = APP_DIR / "ui" / "index.html"


def read_timeline(repo: Path, limit: int = 50) -> list[dict]:
    path = repo / "docs" / "jarvis" / "timeline.md"
    if not path.exists():
        return []
    items = []
    for ln in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^- (\S+ \S+) · \[(.+?)\]\((.+?)\) · ?(.*)$", ln)
        if m:
            link = (Path("docs/jarvis") / m.group(3)).as_posix()
            items.append({"when": m.group(1), "title": m.group(2), "path": _clean(link), "summary": m.group(4)})
    return items[:limit]


def _clean(p: str) -> str:
    parts: list[str] = []
    for seg in p.split("/"):
        if seg == "..":
            if parts:
                parts.pop()
        elif seg and seg != ".":
            parts.append(seg)
    return "/".join(parts)


def make_server(app, port: int):
    token = secrets.token_urlsafe(18)
    repo = Path(app.cfg["repo"]["path"]).resolve()
    allowed_hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):           # 터미널을 조용하게
            pass

        def _ok_request(self) -> bool:
            if self.headers.get("Host") not in allowed_hosts:
                self.send_error(403, "host")
                return False
            q = parse_qs(urlparse(self.path).query)
            if q.get("t", [""])[0] != token and self.headers.get("X-Token") != token:
                self.send_error(403, "token")
                return False
            origin = self.headers.get("Origin")
            if origin and urlparse(origin).netloc not in allowed_hosts:
                self.send_error(403, "origin")
                return False
            return True

        def _json(self, data, code: int = 200) -> None:
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):  # noqa: N802
            if not self._ok_request():
                return
            url = urlparse(self.path)
            if url.path == "/":
                html = UI.read_text(encoding="utf-8").replace("__TOKEN__", token)
                body = html.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline' "
                                 "https://cdn.jsdelivr.net; "
                                 "font-src https://cdn.jsdelivr.net; "
                                 "script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            elif url.path == "/api/state":
                self._json({**app.hub.snapshot(), "timeline": read_timeline(repo), "info": app.info()})
            elif url.path == "/api/file":
                rel = parse_qs(url.query).get("path", [""])[0]
                target = (repo / rel).resolve()
                if not target.is_relative_to(repo / "docs") or target.suffix != ".md" or not target.exists():
                    self._json({"error": "볼 수 없는 파일입니다."}, 404)
                    return
                self._json({"path": rel, "text": target.read_text(encoding="utf-8")[:200_000]})
            elif url.path == "/api/events":
                self._events()
            else:
                self.send_error(404)

        def do_POST(self):  # noqa: N802
            if not self._ok_request():
                return
            n = int(self.headers.get("Content-Length") or 0)
            try:
                data = json.loads(self.rfile.read(n) or b"{}") if n else {}
            except json.JSONDecodeError:
                data = {}
            path = urlparse(self.path).path
            if path == "/api/command":
                text = str(data.get("text", "")).strip()[:2000]
                if text:
                    app.command(text, source="typed")
                self._json({"ok": bool(text)})
            elif path == "/api/listen":
                app.listen()
                self._json({"ok": True})
            elif path == "/api/stop":
                app.stop_speaking()
                self._json({"ok": True})
            else:
                self.send_error(404)

        def _events(self) -> None:
            q = app.hub.subscribe()
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            try:
                while True:
                    try:
                        kind, data = q.get(timeout=15)
                        if kind == "tasks":
                            data = {**data, "timeline": read_timeline(repo)}
                        chunk = f"event: {kind}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
                    except queue.Empty:
                        chunk = ": ping\n\n"
                    self.wfile.write(chunk.encode("utf-8"))
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass
            finally:
                app.hub.unsubscribe(q)

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{port}/?t={token}"
