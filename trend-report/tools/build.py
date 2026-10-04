"""reports/와 images/의 내용을 합쳐 화면이 읽는 data.js를 만든다.

- reports/<주차>.json              : 사례 원본 (Claude 1차 확인 포함)
- reports/<주차>.gpt-review.json   : ChatGPT 교차 검증 결과 (gpt_verify.py)
- reports/<주차>.instagram.json    : 인스타그램 실측 후보 (collect_instagram.py)
- images/<주차>/manifest.json      : ChatGPT 이미지 (gpt_images.py)

사용: python3 tools/build.py
"""

import json

import common


def merge(report):
    week = report["id"]
    reviews = common.load_json(common.REPORTS / f"{week}.gpt-review.json", {})
    images = common.load_json(common.IMAGES / week / "manifest.json", {})
    insta = common.load_json(common.REPORTS / f"{week}.instagram.json", None)

    for item in report["items"]:
        item["review"] = [r for r in item.get("review", []) if r.get("by") != "chatgpt"]
        if item["id"] in reviews:
            item["review"].append(reviews[item["id"]])
        img = images.get(item["id"])
        if img and (common.ROOT / img["file"]).exists():
            item["image"] = {"src": img["file"], "model": img.get("model", ""), "createdAt": img.get("createdAt", "")}
        # ChatGPT 앱에 붙여 넣어 직접 검증할 때 쓰는 프롬프트 (API가 없을 때)
        claude = [r for r in item["review"] if r.get("by") == "claude"]
        item["gptPrompt"] = common.fill_template("verify-item.md", {
            "period": f"{report['periodStart']} ~ {report['periodEnd']}",
            "claude_notes": claude[0]["notes"] if claude else "없음",
            "item": common.item_brief(item),
        })
    if insta:
        report["instagram"] = insta
    return report


def main():
    reports = [merge(common.load_report(w)) for w in common.report_ids()]
    body = json.dumps(reports, ensure_ascii=False, indent=2)
    out = common.ROOT / "data.js"
    out.write_text(
        "// 자동 생성 파일입니다. 직접 고치지 말고 reports/*.json을 고친 뒤\n"
        "// python3 tools/build.py 를 실행하세요.\n"
        f"window.TREND_REPORTS = {body};\n",
        encoding="utf-8",
    )
    gpt = sum(1 for r in reports for i in r["items"] if any(v.get("by") == "chatgpt" for v in i["review"]))
    img = sum(1 for r in reports for i in r["items"] if i.get("image"))
    print(f"data.js 생성: 주차 {len(reports)}개, ChatGPT 검증 {gpt}건, 이미지 {img}장")


if __name__ == "__main__":
    main()
