"""Claude를 거치지 않고 내 컴퓨터에서 바로 처리하는 명령 (사용량 0).

여기서 처리하지 못한 말만 Claude로 간다.
"""
from __future__ import annotations

import os
import re
import webbrowser
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from . import gitops, memory
from .config import DATA_DIR

WEEKDAYS = "월화수목금토일"
TAIL = r"\s*(?:해\s*줘|해\s*주세요|해\s*줄래|해|줘|주세요|좀)?\s*$"


@dataclass
class Reply:
    spoken: str
    detail: str = ""
    source: str = "local"              # local / claude / task
    stop_speaking: bool = False
    meta: dict = field(default_factory=dict)


def clean(text: str) -> str:
    text = text.strip().strip(".!?。,， ")
    return re.sub(r"\s+", " ", text)


def _norm(s: str) -> str:
    return re.sub(r"\s+", "", s).lower()


def add_inbox_item(s: str, line: str) -> str:
    """INBOX.md의 '## 할 일' 구역 맨 끝에 한 줄을 더한다."""
    head = "## 할 일\n"
    if head not in s:
        return s.rstrip("\n") + "\n\n" + head + "\n" + line
    start = s.index(head) + len(head)
    nxt = s.find("\n## ", start)
    end = len(s) if nxt == -1 else nxt
    section = s[start:end].rstrip("\n")
    section = (section + "\n" if section.strip() else "\n") + line
    return s[:start] + section + s[end:]


class Router:
    def __init__(self, cfg: dict, hub, tasks=None):
        self.cfg, self.hub, self.tasks = cfg, hub, tasks
        self.repo = Path(cfg["repo"]["path"])
        self.rules = [
            (r"^(?:그만|멈춰|조용히?|됐어|취소|스톱|stop)" + TAIL, self.stop),
            (r"(?:지금\s*)?몇\s*시|시간\s*(?:알려|좀)", self.time),
            (r"오늘\s*(?:며칠|몇\s*일|날짜)|무슨\s*요일|날짜\s*알려", self.date),
            (r"^(?:메모|기록)(?:\s*해\s*줘|\s*해|\s*좀)?\s*[:,]?\s*(?P<x>.+)$", self.memo),
            (r"^(?P<x>.+?)\s*(?:라고|이라고)?\s*기억해(?:\s*줘|\s*둬|\s*놔)?$", self.remember),
            (r"^기억해(?:\s*줘|\s*둬)?\s*[:,]?\s*(?P<x>.+)$", self.remember),
            (r"^(?P<x>.+?)\s*(?:은|는|을|를)?\s*잊어(?:\s*줘|\s*버려)?$", self.forget),
            (r"에이전트(?:에게|한테|에)\s*(?:시켜|맡겨)(?:\s*줘)?\s*[:,]?\s*(?P<x>.+)$", self.agent),
            (r"^(?P<x>.+?)\s*(?:를|을)?\s*에이전트(?:에게|한테|에)\s*(?:시켜|맡겨)(?:\s*줘)?$", self.agent),
            (r"(?:작업|일)\s*(?:상태|어떻게\s*됐|진행|뭐\s*하고)|뭐\s*하고\s*있어", self.status),
            (r"(?:오늘|하루)\s*(?:한\s*일\s*)?(?:정리|요약|마무리)" + TAIL, self.daily),
            (r"^(?P<x>.+?)\s*(?:을|를)?\s*(?:열어|켜|실행해|띄워)(?:\s*줘|\s*주세요)?$", self.open_app),
        ]

    def handle(self, text: str) -> Reply | None:
        t = clean(text)
        for pattern, fn in self.rules:
            m = re.search(pattern, t, flags=re.IGNORECASE)
            if m:
                reply = fn(m.groupdict().get("x", "") or "", t)
                if reply is not None:
                    return reply
        return None

    # ---- 명령들 ----
    def stop(self, _x, _t):
        return Reply("", stop_speaking=True)

    def time(self, _x, _t):
        n = datetime.now()
        ampm = "오전" if n.hour < 12 else "오후"
        h = n.hour % 12 or 12
        return Reply(f"지금은 {ampm} {h}시 {n.minute}분입니다.")

    def date(self, _x, _t):
        n = datetime.now()
        return Reply(f"오늘은 {n.month}월 {n.day}일 {WEEKDAYS[n.weekday()]}요일입니다.")

    def memo(self, x, _t):
        x = clean(x)
        if not x:
            return None
        path = DATA_DIR / "memo.md"
        new = not path.exists()
        with path.open("a", encoding="utf-8") as f:
            if new:
                f.write("# 메모\n\n")
            f.write(f"- {datetime.now():%Y-%m-%d %H:%M} {x}\n")
        return Reply("메모했습니다.", detail=x)

    def remember(self, x, _t):
        x = clean(x)
        if not x:
            return None
        ok = memory.remember(x)
        return Reply("기억해 둘게요." if ok else "이미 기억하고 있어요.", detail=x)

    def forget(self, x, _t):
        n = memory.forget(clean(x))
        return Reply(f"{n}개를 잊었습니다." if n else "그런 기억은 없어요.")

    def agent(self, x, _t):
        x = clean(x)
        if not x:
            return None
        inbox = self.repo / "agent" / "INBOX.md"
        if not inbox.exists():
            return Reply("에이전트 명령함을 찾지 못했습니다. 설정의 저장소 위치를 확인해 주세요.")
        s = inbox.read_text(encoding="utf-8")
        line = f"- [ ] {x} (자비스 음성 지시, {datetime.now():%Y-%m-%d %H:%M})\n"
        s = add_inbox_item(s, line)
        inbox.write_text(s, encoding="utf-8")
        saved = gitops.commit(str(self.repo), [inbox], f"에이전트 지시: {x[:50]}", self.cfg["repo"]["auto_push"])
        return Reply("에이전트 명령함에 넣었습니다. 다음 실행 때 처리합니다.", detail=f"{x}\n\n{saved}")

    def status(self, _x, _t):
        if not self.tasks:
            return Reply("작업 기능이 꺼져 있어요.")
        act = self.tasks.active()
        if not act:
            done = [t for t in self.hub.tasks if t["status"] == "done"][-1:]
            tail = f" 마지막으로 끝낸 일은 {done[0]['title']}입니다." if done else ""
            return Reply("지금 진행 중인 작업은 없어요." + tail)
        names = ", ".join(t["title"][:20] for t in act[:3])
        return Reply(f"{len(act)}개 작업이 진행 중입니다. {names}.")

    def daily(self, _x, _t):
        if not self.tasks:
            return None
        day = datetime.now().strftime("%Y-%m-%d")
        talk = "\n".join(f"{m['time']} {'나' if m['role'] == 'user' else self.cfg['name']}: {m['text'][:300]}"
                         for m in self.hub.messages if m["role"] in ("user", "jarvis"))[-12000:]
        memo_p = DATA_DIR / "memo.md"
        memos = "\n".join(ln for ln in memo_p.read_text(encoding="utf-8").splitlines() if day in ln) \
            if memo_p.exists() else ""
        done = "\n".join(f"- {t['title']}: {t.get('summary', '')} ({t['report']})"
                         for t in self.hub.tasks if t["status"] == "done")[-4000:]
        prompt = (f"{day} 하루를 정리한 업무 일지를 써 줘.\n구성: 오늘 한 일, 결정한 것, 만든 결과물(보고서 링크), "
                  f"남은 할 일, 내일 먼저 할 것. 사적인 잡담은 빼.\n\n[오늘 대화]\n{talk or '없음'}\n\n"
                  f"[오늘 메모]\n{memos or '없음'}\n\n[끝낸 작업]\n{done or '없음'}")
        path = self.repo / "docs" / "journal" / f"{day}.md"
        self.tasks.start(f"{day} 하루 정리", prompt, report_path=path)
        return Reply("오늘 한 일을 정리하고 있어요. 끝나면 알려 드릴게요.", source="task")

    def open_app(self, x, t):
        apps = self.cfg.get("apps") or {}
        key = _norm(x)
        target = next((v for k, v in apps.items() if _norm(k) == key), None) \
            or next((v for k, v in apps.items() if _norm(k) in key), None)
        if not target:
            return None          # 등록된 프로그램이 아니면 Claude에게 넘긴다 (실행은 하지 않음)
        try:
            if str(target).startswith(("http://", "https://")):
                webbrowser.open(str(target))
            elif hasattr(os, "startfile"):
                os.startfile(str(target))       # noqa: S606  설정에 등록한 것만 연다
            else:
                return Reply(f"이 컴퓨터에서는 {x}을 열 수 없어요.")
        except OSError as e:
            return Reply(f"{x}을 열지 못했습니다.", detail=str(e))
        return Reply(f"{x} 열었습니다.")
