"""마이크와 Claude 없이 돌릴 수 있는 부분 시험. 실행: python -m pytest tests"""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from jarvis import brain, config, memory, router as router_mod  # noqa: E402
from jarvis.audio import strip_wake  # noqa: E402
from jarvis.hub import Hub  # noqa: E402
from jarvis.router import Router, add_inbox_item  # noqa: E402
from jarvis.server import read_timeline  # noqa: E402
from jarvis.tasks import add_to_timeline  # noqa: E402

WORDS = config.load()["wake"]["words"]


@pytest.fixture()
def tmp_env(tmp_path, monkeypatch):
    monkeypatch.setattr(memory, "PATH", tmp_path / "memory.md")
    monkeypatch.setattr(router_mod, "DATA_DIR", tmp_path)
    cfg = config.load()
    cfg["repo"]["path"] = str(tmp_path / "repo")
    cfg["repo"]["auto_push"] = False
    (tmp_path / "repo" / "agent").mkdir(parents=True)
    (tmp_path / "repo" / "agent" / "INBOX.md").write_text("# 명령함\n\n## 할 일\n\n## 끝난 일\n", encoding="utf-8")
    return cfg, tmp_path


@pytest.mark.parametrize("said,called,rest", [
    ("자비스, 오늘 일정 알려 줘", True, "오늘 일정 알려 줘"),
    ("자비스야 몇 시야?", True, "몇 시야?"),
    ("헤이 자비스 메모해 우유 사기", True, "메모해 우유 사기"),
    ("Jarvis, 계산기 열어", True, "계산기 열어"),
    ("쟈비스", True, ""),
    ("오늘 날씨 좋다", False, "오늘 날씨 좋다"),
    ("자동차 보험 알아봐", False, "자동차 보험 알아봐"),
])
def test_strip_wake(said, called, rest):
    assert strip_wake(said, WORDS) == (called, rest)


def test_split_reply():
    s, d = brain.split_reply("**오늘은** 맑습니다.\n---\n- 출처: 기상청")
    assert s == "오늘은 맑습니다." and d == "- 출처: 기상청"
    assert brain.split_reply("짧은 답")[0] == "짧은 답"


def test_is_work():
    assert brain.is_work("경쟁사 세 곳 조사해서 보고서로 만들어 줘")
    assert not brain.is_work("지금 몇 시야")


def test_inbox_item():
    s = "# 명령함\n\n## 할 일\n\n## 끝난 일\n- [x] 예전 일\n"
    s1 = add_inbox_item(s, "- [ ] 첫째\n")
    assert s1 == "# 명령함\n\n## 할 일\n\n- [ ] 첫째\n\n## 끝난 일\n- [x] 예전 일\n"
    s2 = add_inbox_item(s1, "- [ ] 둘째\n")
    assert "- [ ] 첫째\n- [ ] 둘째\n\n## 끝난 일" in s2


def test_router_local(tmp_env):
    cfg, tmp = tmp_env
    r = Router(cfg, Hub(), tasks=None)
    assert "시" in r.handle("지금 몇 시야").spoken
    assert "요일" in r.handle("오늘 며칠이야").spoken
    assert r.handle("메모해 우유 사기").spoken == "메모했습니다."
    assert "우유 사기" in (tmp / "memo.md").read_text(encoding="utf-8")
    assert r.handle("나는 아침에 커피를 마신다고 기억해").spoken == "기억해 둘게요."
    assert "커피" in memory.for_prompt()
    assert r.handle("커피 잊어").spoken == "1개를 잊었습니다."
    assert r.handle("그만").stop_speaking
    assert r.handle("양자역학 설명해 줘") is None           # Claude로 넘어간다
    assert r.handle("포토샵 열어") is None                 # 등록 안 된 프로그램은 실행하지 않는다


def test_router_agent(tmp_env):
    cfg, tmp = tmp_env
    r = Router(cfg, Hub(), tasks=None)
    rep = r.handle("에이전트한테 시켜 README 오타 고치기")
    assert "명령함" in rep.spoken
    assert "- [ ] README 오타 고치기 (자비스 음성 지시" in (tmp / "repo/agent/INBOX.md").read_text(encoding="utf-8")


def test_timeline(tmp_path):
    task = {"title": "경쟁사 조사", "report": "docs/jarvis/reports/2026-11-19-x.md"}
    add_to_timeline(tmp_path, task, "세 곳을 비교했습니다.")
    add_to_timeline(tmp_path, {"title": "하루 정리", "report": "docs/journal/2026-11-19.md"}, "정리함")
    items = read_timeline(tmp_path)
    assert items[0]["title"] == "하루 정리" and items[0]["path"] == "docs/journal/2026-11-19.md"
    assert items[1]["path"] == "docs/jarvis/reports/2026-11-19-x.md"


def test_run_claude_parses(monkeypatch, tmp_path):
    class P:
        returncode = 0
        stdout = json.dumps({"type": "result", "result": "답", "session_id": "s1"})
        stderr = ""
    monkeypatch.setattr(brain.shutil, "which", lambda c: "/bin/claude")
    seen = {}
    monkeypatch.setattr(brain.subprocess, "run", lambda cmd, **kw: seen.setdefault("cmd", cmd) and P())
    out = brain.run_claude(config.load(), "질문", model="haiku", system="s", cwd=str(tmp_path), timeout=5,
                           allowed=["WebSearch"])
    assert out["result"] == "답"
    assert seen["cmd"][seen["cmd"].index("--disallowedTools") + 1] == "Bash"
