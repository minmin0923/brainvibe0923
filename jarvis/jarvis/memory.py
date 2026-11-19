"""자비스가 기억하는 사실. data/memory.md 한 파일에 적고 사람이 직접 고쳐도 된다."""
from __future__ import annotations

from datetime import datetime

from .config import DATA_DIR

PATH = DATA_DIR / "memory.md"
HEADER = "# 자비스 기억\n\n직접 고쳐도 된다. `<!-- -->` 안의 줄은 Claude에 보내지 않는다.\n\n## 배운 것\n"
MAX_ITEMS = 40          # Claude에 보내는 양을 줄이려고 개수를 제한한다


def _read() -> str:
    if not PATH.exists():
        PATH.write_text(HEADER, encoding="utf-8")
    return PATH.read_text(encoding="utf-8")


def items() -> list[str]:
    return [ln[2:].strip() for ln in _read().splitlines() if ln.startswith("- ")]


def remember(fact: str) -> bool:
    fact = fact.strip().rstrip(".")
    if not fact or any(fact == i.split(" (", 1)[0] for i in items()):
        return False
    with PATH.open("a", encoding="utf-8") as f:
        f.write(f"- {fact} ({datetime.now():%Y-%m-%d})\n")
    return True


def forget(keyword: str) -> int:
    keyword = keyword.strip()
    if not keyword:
        return 0
    lines = _read().splitlines()
    keep = [ln for ln in lines if not (ln.startswith("- ") and keyword in ln)]
    PATH.write_text("\n".join(keep) + "\n", encoding="utf-8")
    return len(lines) - len(keep)


def for_prompt() -> str:
    lines = [ln for ln in _read().splitlines() if ln.startswith("- ") and "<!--" not in ln]
    return "\n".join(lines[-MAX_ITEMS:])
