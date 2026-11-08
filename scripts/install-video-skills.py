#!/usr/bin/env python3
"""영상 제작 스킬을 GitHub에서 받아 .claude/skills 에 설치한다.

- 각 저장소를 고정한 커밋으로 받는다 (SOURCES의 commit).
- 영상·음성·GIF, 1MB가 넘는 이미지, 5MB가 넘는 파일, 갤러리 폴더는 빼고 복사한다.
- 설치한 스킬마다 skills-lock.json 에 출처를 적는다.

사용법:  python3 scripts/install-video-skills.py [--download-dir DIR]
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / ".claude" / "skills"
LOCK = ROOT / "skills-lock.json"

SKIP_EXT = {".mp4", ".mov", ".webm", ".mkv", ".gif", ".mp3", ".wav", ".m4a", ".aac", ".avif", ".psd"}
SKIP_DIRS = {".git", "node_modules", ".next", "dist", "out"}
MAX_BYTES = 5 * 1024 * 1024
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}
MAX_IMAGE_BYTES = 1024 * 1024

MOTION_PACKS = {
    "tiktok-video-skills": "2a77533",
    "text-message-video-skills": "3a800e1",
    "youtube-video-skills": "f3df381",
    "ecommerce-video-skills": "2bd0dd1",
    "ad-video-skills": "0de0f2a",
    "data-animation-skills": "8ce2709",
    "explainer-video-skills": "3e2d411",
    "map-animation-skills": "390ca98",
    "web-animation-skills": "b6dba3e",
    "motion-design-skills": "3c129f7",
    "kinetic-typography-skills": "fccc94b",
    "freelance-motion-skills": "d85c2b4",
    "webgl-animation-skills": "50697d6",
    "manim-skills": "a15833c",
    "generative-illustration-skills": "e7d6243",
    "javascript-animation-skills": "f7d0882",
    "lower-thirds-skills": "aa8ef7e",
    "b-roll-skills": "a51e34b",
    "talking-head-skills": "a315032",
}

# (저장소, 커밋, 스킬 위치: "*"는 그 폴더 아래 모든 스킬, "."은 저장소 자체가 스킬 하나)
SOURCES = [
    ("remotion-dev/skills", "a2824c6", "skills/*"),
    ("kajisho5/ffmpeg-skill", "6e42a79", "."),
    ("Vincentwei1021/video-shotcraft", "1266a3e", "."),
    ("Vincentwei1021/video-talkcraft", "a7c29ed", "."),
    ("Vincentwei1021/anything2explainer", "735c79c", "."),
    ("mromidev/claude-animated-shorts", "e3b817b", "."),
    ("jordanrendric/claude-video-vision", "4a4f990", "skills/*"),
    ("heygen-com/hyperframes", "070b964", "skills/*"),
] + [(f"iart-ai/{pack}", commit, "skills/*") for pack, commit in MOTION_PACKS.items()]

# 같은 이름이 두 곳에 있을 때 이 저장소의 것을 쓴다
PREFER = {"lower-thirds": "iart-ai/lower-thirds-skills"}

# 저장소 자체가 스킬일 때 저장소 개발용이라 뺄 폴더
REPO_SKILL_SKIP = {"tests", "evals", "site", "docs", ".github", ".claude", ".agents", "publish", "gallery"}


def run(*args: str, cwd: Path | None = None) -> str:
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def fetch(repo: str, commit: str, dest: Path) -> Path:
    target = dest / repo.replace("/", "_")
    if not target.exists():
        run("git", "clone", "-q", "--filter=blob:none", "--no-checkout", f"https://github.com/{repo}.git", str(target))
    run("git", "checkout", "-q", commit, cwd=target)
    return target


def frontmatter_name(skill_md: Path) -> str | None:
    text = skill_md.read_text(encoding="utf-8", errors="replace")
    if not text.startswith("---"):
        return None
    for line in text.split("\n")[1:]:
        if line.strip() == "---":
            break
        if line.startswith("name:"):
            return line.split(":", 1)[1].strip().strip("'\"")
    return None


def copy_tree(src: Path, dst: Path, top_skip: set[str]) -> tuple[int, int]:
    kept = skipped = 0
    for path in sorted(src.rglob("*")):
        rel = path.relative_to(src)
        if any(part in SKIP_DIRS for part in rel.parts) or (rel.parts and rel.parts[0] in top_skip):
            continue
        if path.is_symlink() or not path.is_file():
            continue
        size = path.stat().st_size
        if path.suffix.lower() in SKIP_EXT or size > MAX_BYTES or (path.suffix.lower() in IMAGE_EXT and size > MAX_IMAGE_BYTES):
            skipped += 1
            continue
        out = dst / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, out)
        kept += 1
    return kept, skipped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download-dir", type=Path)
    args = parser.parse_args()
    dest = args.download_dir or Path(tempfile.mkdtemp(prefix="video-skills-"))
    dest.mkdir(parents=True, exist_ok=True)

    plan: dict[str, tuple[str, str, Path, str, bool]] = {}
    for repo, commit, where in SOURCES:
        checkout = fetch(repo, commit, dest)
        full = run("git", "rev-parse", "HEAD", cwd=checkout)
        if where == ".":
            dirs = [checkout]
        else:
            dirs = sorted(p.parent for p in (checkout / where[:-2]).glob("*/SKILL.md"))
        for d in dirs:
            name = frontmatter_name(d / "SKILL.md") or (repo.split("/")[1] if d == checkout else d.name)
            if name in plan and PREFER.get(name) != repo:
                print(f"  같은 이름 건너뜀: {name} ({repo}, 이미 {plan[name][0]})")
                continue
            rel = "SKILL.md" if d == checkout else f"{d.relative_to(checkout)}/SKILL.md"
            plan[name] = (repo, full, d, rel, d == checkout)

    lock = json.loads(LOCK.read_text()) if LOCK.exists() else {"version": 1, "skills": {}}
    for name, (repo, full, src, rel, is_repo) in sorted(plan.items()):
        dst = SKILLS / name
        if dst.exists() and name not in lock["skills"]:
            print(f"  이미 있는 스킬이라 건너뜀: {name}")
            continue
        if dst.exists():
            shutil.rmtree(dst)
        kept, skipped = copy_tree(src, dst, REPO_SKILL_SKIP if is_repo else set())
        digest = hashlib.sha256((dst / "SKILL.md").read_bytes()).hexdigest()
        lock["skills"][name] = {
            "source": repo,
            "sourceType": "github",
            "skillPath": rel,
            "commit": full,
            "computedHash": digest,
        }
        print(f"설치: {name:32} ← {repo} (파일 {kept}개, 큰 예시 파일 {skipped}개 제외)")

    LOCK.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n")
    print(f"\n스킬 {len(plan)}개 처리. 기록: {LOCK.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
