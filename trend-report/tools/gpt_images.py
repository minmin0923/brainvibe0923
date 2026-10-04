"""ChatGPT 이미지 모델(OpenAI API)로 사례마다 '우리 채널 버전' 스토리보드 이미지를 만든다.

각 사례의 idea(우리 채널에서 만든다면)를 3컷 세로 스토리보드로 그린다.
이미지는 images/<주차>/<사례id>.png에, 기록은 images/<주차>/manifest.json에 남는다.

사용 예:
  python3 tools/gpt_images.py                     # 최신 주차, 아직 없는 이미지만
  python3 tools/gpt_images.py --item jean-phil --force
  python3 tools/gpt_images.py --dry-run           # 프롬프트와 예상 비용만 출력
"""

import argparse
import base64
import sys

import common

# 1024x1536 한 장 기준 대략적인 비용(달러). 가격이 바뀌면 GUIDE.md와 함께 고친다.
EST_COST = {"low": 0.006, "medium": 0.05, "high": 0.2}


def build_prompt(item):
    return common.fill_template("image-item.md", {
        "type": item.get("type", ""),
        "idea": item.get("idea", ""),
        "title": item.get("title", ""),
    })


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--week", help="주차 ID (기본: 최신)")
    ap.add_argument("--item", action="append", help="이 사례만 (여러 번 쓸 수 있음)")
    ap.add_argument("--model", default=common.env("OPENAI_IMAGE_MODEL", "gpt-image-2"), help="이미지 모델 (기본: OPENAI_IMAGE_MODEL 또는 gpt-image-2)")
    ap.add_argument("--quality", choices=list(EST_COST), default="medium")
    ap.add_argument("--size", default="1024x1536", help="세로형 기본값 1024x1536")
    ap.add_argument("--force", action="store_true", help="이미 있는 이미지도 다시 만들기")
    ap.add_argument("--dry-run", action="store_true", help="API를 부르지 않고 프롬프트만 출력")
    args = ap.parse_args()

    report = common.load_report(args.week)
    folder = common.IMAGES / report["id"]
    manifest_path = folder / "manifest.json"
    manifest = common.load_json(manifest_path, {})

    targets = [i for i in report["items"] if not args.item or i["id"] in args.item]
    todo = [i for i in targets if args.force or i["id"] not in manifest]
    if not todo:
        sys.exit("새로 만들 이미지가 없습니다. 다시 만들려면 --force")

    if not args.dry_run:
        common.env("OPENAI_API_KEY", required=True)
    print(f"{len(todo)}장, 예상 비용 약 ${len(todo) * EST_COST[args.quality]:.2f} ({args.quality})")
    for item in todo:
        prompt = build_prompt(item)
        if args.dry_run:
            print(f"===== {item['id']} =====\n{prompt}\n")
            continue
        print(f"- {item['id']}: 이미지 생성 중…", flush=True)
        resp = common.openai_post("/images/generations", {
            "model": args.model,
            "prompt": prompt,
            "size": args.size,
            "quality": args.quality,
            "n": 1,
        })
        data = resp["data"][0]
        if not data.get("b64_json"):
            sys.exit("응답에 이미지 데이터(b64_json)가 없습니다. 모델 이름을 확인하세요.")
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{item['id']}.png").write_bytes(base64.b64decode(data["b64_json"]))
        manifest[item["id"]] = {
            "file": f"images/{report['id']}/{item['id']}.png",
            "model": args.model,
            "quality": args.quality,
            "createdAt": common.today(),
            "prompt": prompt,
        }
        common.save_json(manifest_path, manifest)

    if not args.dry_run:
        print(f"저장: {folder.relative_to(common.ROOT)}. 화면에 반영하려면 python3 tools/build.py")


if __name__ == "__main__":
    main()
