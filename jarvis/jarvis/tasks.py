"""오래 걸리는 일을 뒤에서 처리한다. 그동안 자비스는 다른 말을 계속 들을 수 있다.

- 작업마다 Claude Code를 따로 실행하고(작업 모델), 결과 보고서를 docs/jarvis/reports/에 쓴다.
- 작업 목록은 data/tasks.json에 남는다. 꺼졌다 켜지면 하던 작업은 '중단됨'으로 표시한다.
"""
from __future__ import annotations

import json
import re
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Callable

from . import gitops
from .brain import WORK_RULES, ClaudeError, run_claude, split_reply
from .config import DATA_DIR

STORE = DATA_DIR / "tasks.json"
LABELS = {"queued": "대기", "running": "진행 중", "done": "완료", "failed": "실패", "lost": "중단됨"}


def _slug(text: str) -> str:
    s = re.sub(r"[^\w가-힣]+", "-", text).strip("-")
    return s[:40] or "task"


def add_to_timeline(repo: Path, task: dict, summary: str) -> Path:
    """docs/jarvis/timeline.md 맨 위(제목 아래)에 한 줄을 더한다. 최근 것이 위로 온다."""
    path = repo / "docs" / "jarvis" / "timeline.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    head = "# 자비스 타임라인\n\n자비스가 끝낸 일과 하루 정리가 최근 순으로 쌓인다. 자동으로 적히는 파일이다.\n\n"
    body = path.read_text(encoding="utf-8")[len(head):] if path.exists() else ""
    link = Path(task["report"]).relative_to("docs/jarvis") if task["report"].startswith("docs/jarvis/") \
        else Path("../..") / task["report"]
    line = f"- {datetime.now():%Y-%m-%d %H:%M} · [{task['title']}]({link.as_posix()}) · {summary[:120]}\n"
    path.write_text(head + line + body, encoding="utf-8")
    return path


class TaskRunner:
    def __init__(self, cfg: dict, hub, on_done: Callable[[dict], None]):
        self.cfg, self.hub, self.on_done = cfg, hub, on_done
        self.sem = threading.Semaphore(cfg["claude"]["max_parallel_tasks"])
        self.lock = threading.Lock()
        self._load()

    def _load(self) -> None:
        if STORE.exists():
            try:
                self.hub.tasks = json.loads(STORE.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                self.hub.tasks = []
        for t in self.hub.tasks:
            if t["status"] in ("queued", "running"):
                t["status"], t["status_label"] = "lost", LABELS["lost"]
        self._save()

    def _save(self) -> None:
        STORE.write_text(json.dumps(self.hub.tasks[-200:], ensure_ascii=False, indent=1), encoding="utf-8")
        self.hub.tasks_changed()

    def _update(self, task: dict, **kw) -> None:
        with self.lock:
            task.update(kw)
            if "status" in kw:
                task["status_label"] = LABELS[kw["status"]]
            self._save()

    def active(self) -> list[dict]:
        return [t for t in self.hub.tasks if t["status"] in ("queued", "running")]

    def start(self, title: str, prompt: str, *, report_path: Path | None = None, rules: str | None = None) -> dict:
        repo = Path(self.cfg["repo"]["path"])
        if report_path is None:
            report_path = repo / "docs" / "jarvis" / "reports" / f"{datetime.now():%Y-%m-%d-%H%M}-{_slug(title)}.md"
        task = {"id": uuid.uuid4().hex[:8], "title": title[:80], "status": "queued", "status_label": LABELS["queued"],
                "created": datetime.now().strftime("%m-%d %H:%M"), "finished": "", "summary": "",
                "report": str(report_path.relative_to(repo)).replace("\\", "/"), "session_id": ""}
        with self.lock:
            self.hub.tasks.append(task)
            self._save()
        threading.Thread(target=self._run, args=(task, prompt, report_path, rules), daemon=True).start()
        return task

    def _run(self, task: dict, prompt: str, report_path: Path, rules: str | None) -> None:
        with self.sem:
            self._update(task, status="running")
            started = time.time()
            report_path.parent.mkdir(parents=True, exist_ok=True)
            c = self.cfg["claude"]
            system = (rules or WORK_RULES).format(name=self.cfg["name"], report=task["report"])
            try:
                data = run_claude(self.cfg, prompt, model=c["work_model"], system=system,
                                  cwd=self.cfg["repo"]["path"], timeout=c["work_timeout_seconds"],
                                  allowed=["WebSearch", "WebFetch", "Read", "Glob", "Grep", "Write", "Edit"],
                                  permission_mode="acceptEdits")
                spoken, _ = split_reply(data["result"])
                saved = ""
                if report_path.exists():
                    timeline = add_to_timeline(Path(self.cfg["repo"]["path"]), task, spoken)
                    saved = gitops.commit(self.cfg["repo"]["path"], [report_path, timeline],
                                          f"자비스: {task['title']}", self.cfg["repo"]["auto_push"])
                self._update(task, status="done", summary=spoken, session_id=data.get("session_id", ""),
                             finished=datetime.now().strftime("%m-%d %H:%M"),
                             seconds=round(time.time() - started), saved=saved,
                             has_report=report_path.exists())
            except ClaudeError as e:
                self._update(task, status="failed", summary=str(e)[:300],
                             finished=datetime.now().strftime("%m-%d %H:%M"))
        self.on_done(task)
