"""인스타그램 해시태그에서 리포트 기간의 릴스를 모아 실제 조회수 순으로 정리한다 (선택 기능).

Apify의 인스타그램 해시태그 스크레이퍼를 쓴다. APIFY_TOKEN이 필요하다.
결과는 reports/<주차>.instagram.json에 저장되고, 화면의 '인스타그램 실측 후보' 표에 나온다.
여기 나온 후보는 사람이 보고 골라서 reports/<주차>.json 사례로 옮긴다.

사용 예:
  python3 tools/collect_instagram.py
  python3 tools/collect_instagram.py --hashtag AI영상 --hashtag aivideo --limit 100
  python3 tools/collect_instagram.py --dry-run
"""

import argparse
import json
from datetime import datetime, timedelta, timezone

import common

DEFAULT_TAGS = ["AI영상", "AI릴스", "챗GPT프롬프트", "aivideo", "aiart", "aitrend"]


def pick(row, *keys, default=None):
    for k in keys:
        if row.get(k) not in (None, ""):
            return row[k]
    return default


def normalize(row, tag):
    views = pick(row, "videoPlayCount", "videoViewCount", "playCount", "viewCount", default=0) or 0
    likes = pick(row, "likesCount", "likeCount", default=0) or 0
    comments = pick(row, "commentsCount", "commentCount", default=0) or 0
    return {
        "url": pick(row, "url", "postUrl", default=""),
        "owner": pick(row, "ownerUsername", "username", default=""),
        "caption": (pick(row, "caption", "text", default="") or "")[:200],
        "postedAt": pick(row, "timestamp", "takenAt", "createdAt", default=""),
        "views": int(views),
        "likes": max(int(likes), 0),  # 좋아요를 숨기면 -1이 오는 경우가 있다
        "comments": int(comments),
        "hashtag": tag,
    }


def in_window(posted, start, end):
    try:
        t = datetime.fromisoformat(str(posted).replace("Z", "+00:00"))
    except ValueError:
        return False
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    return start <= t <= end


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--week", help="주차 ID (기본: 최신)")
    ap.add_argument("--hashtag", action="append", help=f"해시태그 (# 없이). 기본: {', '.join(DEFAULT_TAGS)}")
    ap.add_argument("--limit", type=int, default=60, help="해시태그마다 가져올 게시물 수")
    ap.add_argument("--actor", default=common.env("APIFY_ACTOR", "apify~instagram-hashtag-scraper"))
    ap.add_argument("--extra-input", default=common.env("APIFY_EXTRA_INPUT", '{"resultsType": "reels"}'),
                    help="액터에 추가로 넘길 입력 JSON. 액터마다 입력 이름이 다르니 액터 페이지를 확인한다.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    report = common.load_report(args.week)
    tags = args.hashtag or DEFAULT_TAGS
    start = datetime.fromisoformat(report["periodStart"]).replace(tzinfo=timezone.utc)
    end = datetime.fromisoformat(report["periodEnd"]).replace(tzinfo=timezone.utc) + timedelta(days=1)
    actor_input = {"hashtags": tags, "resultsLimit": args.limit, **json.loads(args.extra_input)}

    if args.dry_run:
        print(f"액터: {args.actor}\n입력: {json.dumps(actor_input, ensure_ascii=False)}\n기간: {report['periodStart']} ~ {report['periodEnd']}")
        return

    token = common.env("APIFY_TOKEN", required=True)
    url = f"https://api.apify.com/v2/acts/{args.actor}/run-sync-get-dataset-items?format=json&clean=true"
    print(f"Apify에서 해시태그 {len(tags)}개 수집 중… (몇 분 걸릴 수 있음)", flush=True)
    rows = common.post_json(url, actor_input, {"Authorization": f"Bearer {token}"}, timeout=900)

    seen, candidates = set(), []
    for row in rows:
        tag = pick(row, "inputHashtag", "hashtag", "searchTerm", default="")
        c = normalize(row, tag)
        if not c["url"] or c["url"] in seen or not in_window(c["postedAt"], start, end):
            continue
        seen.add(c["url"])
        # 조회수가 주 기준이고, 저장과 공유를 대신해 댓글에 가중치를 조금 준다.
        c["score"] = c["views"] + c["likes"] * 10 + c["comments"] * 30
        candidates.append(c)
    candidates.sort(key=lambda c: c["score"], reverse=True)

    out = common.REPORTS / f"{report['id']}.instagram.json"
    common.save_json(out, {
        "collectedAt": common.today(),
        "actor": args.actor,
        "hashtags": tags,
        "fetched": len(rows),
        "candidates": candidates[:50],
    })
    print(f"받은 게시물 {len(rows)}개, 기간 안 후보 {len(candidates)}개. 저장: {out.relative_to(common.ROOT)}")


if __name__ == "__main__":
    main()
