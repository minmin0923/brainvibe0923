#!/usr/bin/env python3
"""OpenAI 이미지 API로 이미지를 만들거나 고친다.

API 키는 클라우드 세션의 프록시가 api.openai.com 요청에 넣어 준다.
로컬에서 쓸 때는 OPENAI_API_KEY 환경 변수를 둔다.

  만들기: python3 image.py generate "프롬프트" [--size 1536x1024] [--quality high] [--n 2]
  고치기: python3 image.py edit "프롬프트" --image a.png [--image b.png] [--mask m.png]

결과는 generated/images/ 에 PNG(또는 지정 형식)와 같은 이름의 .json(프롬프트·설정)으로 저장한다.
"""
import argparse
import base64
import datetime as dt
import json
import mimetypes
import os
import re
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

API = "https://api.openai.com/v1/images"
DEFAULT_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2")


def repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / ".git").exists():
            return parent
    return Path.cwd()


def slug(text: str) -> str:
    s = re.sub(r"[^\w가-힣]+", "-", text.strip().lower())[:40].strip("-")
    return s or "image"


def key() -> str:
    # 프록시가 실제 키로 바꿔 넣는다. 로컬에서는 환경 변수 값을 쓴다.
    return os.environ.get("OPENAI_API_KEY") or "sk-proxy-injected"


def post(url: str, body: bytes, content_type: str) -> dict:
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Authorization": f"Bearer {key()}", "Content-Type": content_type},
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")
        try:
            detail = json.loads(detail)["error"]["message"]
        except Exception:
            pass
        sys.exit(f"OpenAI 오류 {err.code}: {detail}")


def multipart(fields: dict[str, str], files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = bytearray()
    for name, value in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
    for name, path in files:
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        out += (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{path.name}"\r\n'
            f"Content-Type: {mime}\r\n\r\n"
        ).encode()
        out += path.read_bytes() + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={boundary}"


def save(result: dict, args: argparse.Namespace, mode: str) -> list[Path]:
    out_dir = Path(args.out) if args.out else repo_root() / "generated" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    base = args.name or slug(args.prompt)
    saved = []
    for i, item in enumerate(result.get("data", []), 1):
        suffix = f"-{i}" if len(result["data"]) > 1 else ""
        path = out_dir / f"{stamp}-{base}{suffix}.{args.format}"
        path.write_bytes(base64.b64decode(item["b64_json"]))
        meta = {
            "mode": mode,
            "prompt": args.prompt,
            "revised_prompt": item.get("revised_prompt"),
            "model": args.model,
            "size": args.size,
            "quality": args.quality,
            "background": args.background,
            "inputs": [str(p) for p in getattr(args, "image", []) or []],
            "created": stamp,
            "usage": result.get("usage"),
        }
        path.with_suffix(".json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
        saved.append(path)
    return saved


def main() -> int:
    parser = argparse.ArgumentParser(description="OpenAI 이미지 만들기/고치기")
    sub = parser.add_subparsers(dest="mode", required=True)
    for mode in ("generate", "edit"):
        p = sub.add_parser(mode)
        p.add_argument("prompt")
        p.add_argument("--model", default=DEFAULT_MODEL)
        p.add_argument("--size", default="auto", help="1024x1024, 1536x1024(가로), 1024x1536(세로), auto")
        p.add_argument("--quality", default="auto", choices=["low", "medium", "high", "auto"])
        p.add_argument("--n", type=int, default=1)
        p.add_argument("--background", default="auto", choices=["transparent", "opaque", "auto"])
        p.add_argument("--format", default="png", choices=["png", "jpeg", "webp"])
        p.add_argument("--out", help="저장 폴더 (기본: generated/images)")
        p.add_argument("--name", help="파일 이름 앞부분 (기본: 프롬프트에서 만듦)")
        if mode == "edit":
            p.add_argument("--image", type=Path, action="append", required=True, help="고칠 이미지 (여러 번 가능)")
            p.add_argument("--mask", type=Path, help="투명한 곳만 고칠 마스크 PNG")
    args = parser.parse_args()

    fields = {
        "model": args.model,
        "prompt": args.prompt,
        "size": args.size,
        "quality": args.quality,
        "n": str(args.n),
        "background": args.background,
        "output_format": args.format,
    }
    if args.mode == "generate":
        body = dict(fields, n=args.n)
        result = post(f"{API}/generations", json.dumps(body).encode(), "application/json")
    else:
        for path in args.image + ([args.mask] if args.mask else []):
            if not path.is_file():
                sys.exit(f"파일이 없습니다: {path}")
        files = [("image[]", p) for p in args.image] + ([("mask", args.mask)] if args.mask else [])
        body, ctype = multipart(fields, files)
        result = post(f"{API}/edits", body, ctype)

    for path in save(result, args, args.mode):
        print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
