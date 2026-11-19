"""설정 읽기. config.example.yaml을 기본값으로, config.yaml을 그 위에 덮어쓴다."""
from __future__ import annotations

import copy
from pathlib import Path

import yaml

APP_DIR = Path(__file__).resolve().parent.parent          # jarvis/
DATA_DIR = APP_DIR / "data"                                # 내 컴퓨터에만 남는 기록 (gitignore)


def _merge(base: dict, over: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def load(path: str | Path | None = None) -> dict:
    base = yaml.safe_load((APP_DIR / "config.example.yaml").read_text(encoding="utf-8-sig"))
    user_path = Path(path) if path else APP_DIR / "config.yaml"
    if user_path.exists():
        base = _merge(base, yaml.safe_load(user_path.read_text(encoding="utf-8-sig")) or {})
    repo = Path(base["repo"]["path"])
    base["repo"]["path"] = str((APP_DIR / repo).resolve() if not repo.is_absolute() else repo)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return base
