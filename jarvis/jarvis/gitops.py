"""저장소에 기록을 남기고 GitHub에 올린다. 실패해도 자비스는 멈추지 않는다."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

FLAGS = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0


def _git(repo: str, *args: str, timeout: int = 60) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=repo, capture_output=True, text=True, encoding="utf-8",
                          errors="replace", timeout=timeout, creationflags=FLAGS)


def commit(repo: str, paths: list[str | Path], message: str, push: bool) -> str:
    """바꾼 파일만 커밋한다. 결과를 한 줄로 돌려준다."""
    try:
        rel = [str(Path(p).resolve().relative_to(Path(repo).resolve())) for p in paths]
        _git(repo, "add", "--", *rel)
        r = _git(repo, "commit", "-m", message, "--", *rel)
        if r.returncode != 0 and "nothing" in (r.stdout + r.stderr):
            return "바뀐 내용 없음"
        if r.returncode != 0:
            return f"커밋 실패: {(r.stderr or r.stdout).strip()[-200:]}"
        if not push:
            return "커밋함"
        _git(repo, "pull", "--rebase", "--autostash", timeout=120)
        r = _git(repo, "push", timeout=120)
        return "GitHub에 올림" if r.returncode == 0 else f"올리기 실패: {r.stderr.strip()[-200:]}"
    except Exception as e:  # noqa: BLE001  기록 실패로 비서가 멈추면 안 된다
        return f"기록 실패: {e}"
