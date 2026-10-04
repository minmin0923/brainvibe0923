"""ChatGPT(OpenAI API)로 리포트의 각 사례를 다시 검증한다.

Claude가 정리하고 1차 확인한 사례를 GPT가 웹 검색으로 따로 확인한다.
결과는 reports/<주차>.gpt-review.json에 저장되고, build.py가 화면에 합친다.

사용 예:
  python3 tools/gpt_verify.py                    # 최신 주차 전체
  python3 tools/gpt_verify.py --item jean-phil   # 한 사례만
  python3 tools/gpt_verify.py --dry-run          # API 호출 없이 보낼 프롬프트만 출력
  python3 tools/gpt_verify.py --import jean-phil answer.json
      # API 없이 ChatGPT 앱에서 받은 JSON 답을 저장 (화면의 'ChatGPT 검증 프롬프트 복사' 버튼 사용)
"""

import argparse
import json
import re
import sys

import common

CLAIM_RESULT = {"type": "string", "enum": list(common.VERDICTS)}
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["verdict", "inWindow", "notes", "claims", "newMetrics", "newSources", "ideas"],
    "properties": {
        "verdict": CLAIM_RESULT,
        "inWindow": {"type": "boolean"},
        "notes": {"type": "string"},
        "claims": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["claim", "result", "note", "sourceUrl"],
                "properties": {
                    "claim": {"type": "string"},
                    "result": CLAIM_RESULT,
                    "note": {"type": "string"},
                    "sourceUrl": {"type": "string"},
                },
            },
        },
        "newMetrics": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["text", "sourceUrl"],
                "properties": {"text": {"type": "string"}, "sourceUrl": {"type": "string"}},
            },
        },
        "newSources": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["label", "url"],
                "properties": {"label": {"type": "string"}, "url": {"type": "string"}},
            },
        },
        "ideas": {"type": "array", "items": {"type": "string"}},
    },
}


def build_prompt(report, item):
    claude = [r for r in item.get("review", []) if r.get("by") == "claude"]
    return common.fill_template("verify-item.md", {
        "period": f"{report['periodStart']} ~ {report['periodEnd']}",
        "claude_notes": claude[0]["notes"] if claude else "없음",
        "item": common.item_brief(item),
    })


def parse_result(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            raise
        return json.loads(match.group(0))


def verify(report, item, model):
    payload = {
        "model": model,
        "input": build_prompt(report, item),
        "tools": [{"type": "web_search"}],
        "text": {"format": {"type": "json_schema", "name": "verification", "schema": SCHEMA, "strict": True}},
    }
    resp = common.openai_post("/responses", payload)
    result = parse_result(common.response_text(resp))
    if result.get("verdict") not in common.VERDICTS:
        result["verdict"] = "unconfirmed"
    result["citations"] = common.response_citations(resp)
    result.update({"by": "chatgpt", "model": resp.get("model", model), "checkedAt": common.today()})
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--week", help="주차 ID, 예: 2026-W40 (기본: 최신)")
    ap.add_argument("--item", action="append", help="이 사례만 검증 (여러 번 쓸 수 있음)")
    ap.add_argument("--model", default=common.env("OPENAI_TEXT_MODEL", "gpt-5"), help="검증에 쓸 모델 (기본: OPENAI_TEXT_MODEL 또는 gpt-5)")
    ap.add_argument("--force", action="store_true", help="이미 검증한 사례도 다시 검증")
    ap.add_argument("--dry-run", action="store_true", help="API를 부르지 않고 프롬프트만 출력")
    ap.add_argument("--import", dest="import_", nargs=2, metavar=("ITEM_ID", "JSON_FILE"),
                    help="ChatGPT 앱에서 받은 JSON 답을 이 사례의 검증 결과로 저장")
    args = ap.parse_args()

    report = common.load_report(args.week)
    out_path = common.REPORTS / f"{report['id']}.gpt-review.json"
    reviews = common.load_json(out_path, {})

    if args.import_:
        item_id, path = args.import_
        if item_id not in {i["id"] for i in report["items"]}:
            sys.exit(f"{item_id} 사례가 {report['id']}에 없습니다.")
        with open(path, encoding="utf-8") as f:
            result = parse_result(f.read())
        missing = [k for k in SCHEMA["required"] if k not in result]
        if missing or result.get("verdict") not in common.VERDICTS:
            sys.exit(f"JSON 형식이 맞지 않습니다. 빠진 항목: {', '.join(missing) or 'verdict 값'}")
        result.update({"by": "chatgpt", "model": "ChatGPT 앱", "checkedAt": common.today(), "citations": []})
        reviews[item_id] = result
        common.save_json(out_path, reviews)
        print(f"저장: {item_id} ({result['verdict']}). 화면에 반영하려면 python3 tools/build.py")
        return

    targets = [i for i in report["items"] if not args.item or i["id"] in args.item]
    if not targets:
        sys.exit("검증할 사례가 없습니다. --item 값을 확인하세요.")

    if not args.dry_run:
        common.env("OPENAI_API_KEY", required=True)
    for item in targets:
        if item["id"] in reviews and not args.force and not args.dry_run:
            print(f"- {item['id']}: 이미 검증함 (다시 하려면 --force)")
            continue
        if args.dry_run:
            print(f"===== {item['id']} =====\n{build_prompt(report, item)}\n")
            continue
        print(f"- {item['id']}: {args.model}로 검증 중…", flush=True)
        reviews[item["id"]] = verify(report, item, args.model)
        common.save_json(out_path, reviews)  # 중간에 끊겨도 앞의 결과는 남긴다
        print(f"  판정: {reviews[item['id']]['verdict']}")

    if not args.dry_run:
        print(f"저장: {out_path.relative_to(common.ROOT)}. 화면에 반영하려면 python3 tools/build.py")


if __name__ == "__main__":
    main()
