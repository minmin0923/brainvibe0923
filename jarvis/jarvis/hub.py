"""화면, 음성, 두뇌가 함께 보는 상태판. 바뀔 때마다 화면(SSE)으로 알린다."""
from __future__ import annotations

import json
import queue
import threading
import time
from datetime import datetime

from .config import DATA_DIR

STATES = {"idle": "대기 중", "listening": "듣는 중", "thinking": "생각 중", "speaking": "말하는 중", "error": "문제 발생"}


class Hub:
    def __init__(self, name: str = "자비스"):
        self.name = name
        self.state = "idle"
        self.detail = ""
        self.messages: list[dict] = []      # 오늘 대화 (화면용)
        self.tasks: list[dict] = []         # 진행 중/끝난 작업 (tasks.py가 채움)
        self.level_db = -90.0
        self._subs: list[queue.Queue] = []
        self._lock = threading.Lock()
        self.journal_dir = DATA_DIR / "journal"
        self.journal_dir.mkdir(parents=True, exist_ok=True)
        self._load_today()

    # ---- 구독 (화면) ----
    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=200)
        with self._lock:
            self._subs.append(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            if q in self._subs:
                self._subs.remove(q)

    def emit(self, kind: str, data: dict) -> None:
        with self._lock:
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait((kind, data))
            except queue.Full:
                pass

    def snapshot(self) -> dict:
        return {"name": self.name, "state": self.state, "state_label": STATES.get(self.state, self.state),
                "detail": self.detail, "messages": self.messages[-60:], "tasks": self.tasks[-30:]}

    # ---- 상태 ----
    def set_state(self, state: str, detail: str = "") -> None:
        self.state, self.detail = state, detail
        self.emit("state", {"state": state, "state_label": STATES.get(state, state), "detail": detail})

    def set_level(self, db: float, bands: list[float] | None = None) -> None:
        self.level_db = db
        self.emit("level", {"db": round(db, 1), "bands": bands or []})

    # ---- 대화 기록 ----
    def add_message(self, role: str, text: str, *, detail: str = "", source: str = "", meta: dict | None = None) -> dict:
        msg = {"time": datetime.now().strftime("%H:%M"), "ts": time.time(), "role": role, "text": text,
               "detail": detail, "source": source, **(meta or {})}
        self.messages.append(msg)
        self._journal(msg)
        self.emit("message", msg)
        return msg

    def tasks_changed(self) -> None:
        self.emit("tasks", {"tasks": self.tasks[-30:]})

    def _journal_path(self, day: str | None = None):
        return self.journal_dir / f"{day or datetime.now().strftime('%Y-%m-%d')}.jsonl"

    def _journal(self, msg: dict) -> None:
        with self._journal_path().open("a", encoding="utf-8") as f:
            f.write(json.dumps(msg, ensure_ascii=False) + "\n")

    def _load_today(self) -> None:
        p = self._journal_path()
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                try:
                    self.messages.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    def recent_turns(self, n: int) -> list[dict]:
        return [m for m in self.messages if m["role"] in ("user", "jarvis")][-n * 2:]
