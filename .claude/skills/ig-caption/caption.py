#!/usr/bin/env python3
"""
caption.py - lint an Instagram caption and show exactly what the feed shows
before the "... more".

Instagram gives a caption about 125 characters in the feed and hides the rest
behind a tap. Almost every caption that fails, fails there: the hook is in
sentence three, or the first line is a greeting, or the whole thing opens on a
hashtag. This prints the visible window as a box so you can read it the way a
scrolling stranger does, then checks the eight things that are worth checking.

The 125-character cut is an approximation. The real number moves with the
device, the font size and where your line breaks fall, which is exactly why
you want a margin rather than a caption engineered to end at 125. Change it
with --truncate if you want to test a tighter one.

Usage
  python3 caption.py caption.txt
  python3 caption.py caption.txt --keywords "proposal software,client contract"
  pbpaste | python3 caption.py -
  python3 caption.py caption.txt --json
"""

import argparse
import json
import os
import re
import sys
import textwrap

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ig-reel"))
import ko  # noqa: E402  한국어 처리

LIMIT = 2200             # Instagram's hard caption limit.
TRUNCATE = 125           # Roughly where the feed cuts to "... more".
HASHTAG_LIMIT = 5        # Instagram's cap per post or reel since 18 Dec 2025,
                         # down from 30. Announced by the @Creators account:
                         # "using fewer (up to 5) more targeted hashtags,
                         # rather than many generic ones, can improve both your
                         # content's performance and people's experience".

HASHTAG_RE = re.compile(r"(?:^|\s)(#[A-Za-z0-9_가-힣]+)")   # 한글 해시태그 포함
MENTION_RE = re.compile(r"(?:^|\s)(@[A-Za-z0-9_.]+)")
LINK_RE = re.compile(r"https?://\S+|\bwww\.\S+|\b[a-z0-9-]+\.(?:com|co|io|net|org|ai|app)/\S*",
                     re.IGNORECASE)
EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF☀-➿←-⇿️]")
CONCRETE_RE = re.compile(r"\$\s?\d|\d[\d,.]*|(?<!^)\b[A-Z][a-z]{2,}\b", re.MULTILINE)

ASKS = [
    (re.compile(r"(?i)\bcomment (?:the word |\")?[A-Z0-9]{2,}\b"), "comment a keyword"),
    (re.compile(r"(?i)\b(?:dm|message) me\b"), "DM me"),
    (re.compile(r"(?i)\bsave (?:this|it)\b"), "save this"),
    (re.compile(r"(?i)\bshare (?:this|it)\b"), "share this"),
    (re.compile(r"(?i)\bfollow (?:me|for)\b"), "follow"),
    (re.compile(r"(?i)\blink in (?:my )?bio\b"), "link in bio"),
    (re.compile(r"(?i)\b(?:swipe|tap) (?:through|left|right|for|to)\b"), "swipe or tap"),
    (re.compile(r"(?i)\btell me\b|\bwhat would you\b|\bwhich one\b"), "answer a question"),
]

FILLER_TAGS = {"#viral", "#fyp", "#explore", "#explorepage", "#foryou", "#foryoupage",
               "#trending", "#instagood", "#love", "#follow", "#like4like", "#reels",
               "#reelsinstagram", "#viralreels", "#instadaily"}


def visible_window(text, cut):
    """What the feed shows. Instagram cuts mid-word, so this does too.

    한국어판: 한글은 영문보다 넓어서 같은 줄에 덜 들어간다. 한국어 캡션은 표시 폭으로 자른다
    (한글 1자 = 영문 1.7자 폭, 추정치). 125 폭이면 한글로 약 70자다.
    """
    flat = text.strip()
    if ko.is_ko(flat):
        return flat if ko.width(flat) <= cut else ko.cut_by_width(flat, cut)
    return flat if len(flat) <= cut else flat[:cut]


def render_box(window, truncated, out=sys.stdout, width=52):
    print("\n  피드에 보이는 부분", file=out)
    print("  +" + "-" * (width + 2) + "+", file=out)
    # 터미널에서 한글은 2칸을 차지하므로 칸 수로 줄을 나누고 채운다.
    def cols(t):
        return sum(2 if ko.is_wide(c) else 1 for c in t)

    def wrap(t):
        out_lines, cur = [], ""
        for ch in t:
            if cols(cur + ch) > width:
                out_lines.append(cur)
                cur = ch.lstrip()
            else:
                cur += ch
        return out_lines + ([cur] if cur else [])

    lines = []
    for raw in window.split("\n"):
        lines.extend(wrap(raw) or [""])
    for line in lines[:8]:
        print(f"  | {line}{' ' * (width - cols(line))} |", file=out)
    tail = "... 더 보기" if truncated else "(캡션 전체가 보임)"
    tail_cols = sum(2 if ko.is_wide(c) else 1 for c in tail)
    print("  +" + "-" * (width + 2 - tail_cols - 2) + f" {tail} " + "+", file=out)


def analyse(text, cut=TRUNCATE, keywords=None):
    text = text.rstrip()
    stripped = text.strip()
    chars = len(stripped)
    lines = [l for l in stripped.split("\n")]
    first_line = lines[0].strip() if lines else ""
    tags = HASHTAG_RE.findall(stripped)
    mentions = MENTION_RE.findall(stripped)
    links = LINK_RE.findall(stripped)
    emoji = EMOJI_RE.findall(stripped)
    window = visible_window(stripped, cut)
    truncated = len(window) < chars
    korean = ko.is_ko(stripped)
    asks = [name for pattern, name in ASKS if pattern.search(stripped)]
    asks += [name for pattern, name in ko.ASKS_KO if pattern.search(stripped) and name not in asks]
    filler = [t for t in tags if t.lower() in FILLER_TAGS or t in ko.FILLER_TAGS_KO]
    keywords = [k.strip() for k in (keywords or []) if k.strip()]

    checks = []

    def add(name, status, detail):
        checks.append({"check": name, "status": status, "detail": detail})

    add("LENGTH", "FAIL" if chars > LIMIT else "PASS",
        f"{chars} / {LIMIT}자" + (f", 한도보다 {chars - LIMIT}자 많음"
                                           if chars > LIMIT else ""))

    if not first_line:
        add("FIRST LINE", "FAIL", "캡션이 빈 줄로 시작함")
    elif first_line.startswith("#") or first_line.startswith("@"):
        add("FIRST LINE", "FAIL",
            "해시태그나 @멘션으로 시작함. 문장이 들어가야 할 유일한 자리다")
    elif len(first_line) > cut:
        add("FIRST LINE", "WARN",
            f"첫 줄이 {len(first_line)}자라서 '... 더 보기'에서 중간에 잘림. "
            "궁금하게 끊기면 괜찮고, 문장 중간의 군더더기에서 끊기면 나쁨")
    else:
        add("FIRST LINE", "PASS", f"{len(first_line)}자, 잘리지 않고 다 보임")

    if korean and re.match(r"\s*(안녕하세요|여러분 안녕|반갑습니다|오늘은)", first_line):
        add("FIRST LINE", "WARN", "첫 줄이 인사나 '오늘은'으로 시작함 - 피드에서 보이는 유일한 자리를 낭비함")

    add("HOOK IS CONCRETE", "PASS" if CONCRETE_RE.search(window) else "WARN",
        f"보이는 부분에 숫자·이름 {len(CONCRETE_RE.findall(window))}개"
        + ("" if CONCRETE_RE.search(window) else " - '더 보기' 전에 확인할 만한 게 없음"))

    if len(tags) > HASHTAG_LIMIT:
        add("HASHTAGS", "FAIL", f"해시태그 {len(tags)}개, 인스타그램 한도 {HASHTAG_LIMIT}개 초과. "
                                "6번째부터는 효과가 없고 오래된 계정처럼 보임")
    elif len(tags) == HASHTAG_LIMIT and filler:
        add("HASHTAGS", "WARN", f"해시태그 {len(tags)}개로 한도에 찼는데 "
                                f"{len(filler)}개가 의미 없는 태그. 다섯 개를 주제어에 쓰기")
    elif filler:
        add("HASHTAGS", "WARN", f"해시태그 {len(tags)}개 중 {len(filler)}개가 의미 없는 태그 "
                                f"({', '.join(filler[:3])}). 아무것도 설명하지 않음")
    else:
        add("HASHTAGS", "PASS", f"해시태그 {len(tags)}개" + (f": {' '.join(tags)}" if tags else ""))

    if not tags:
        add("TAG PLACEMENT", "PASS", "해시태그 없음")
    elif any(re.search(r"(?:^|\s)" + re.escape(t) + r"\b", window) for t in tags):
        add("TAG PLACEMENT", "WARN", "보이는 부분에 해시태그가 있음. "
                                     "피드 자리를 꼬리표에 씀")
    else:
        add("TAG PLACEMENT", "PASS", "해시태그가 '더 보기' 아래에 있음")

    add("LINKS", "WARN" if links else "PASS",
        f"캡션에 링크 {len(links)}개. 캡션 링크는 눌리지 않음. "
        f"프로필 링크나 DM으로 옮기기" if links else "눌리지 않는 링크 없음")

    if len(asks) == 1:
        add("ONE ASK", "PASS", f"행동 요청 하나: {asks[0]}")
    elif not asks:
        add("ONE ASK", "WARN", "행동 요청이 없음. 이 게시물이 무엇을 위한 건지 정하기")
    else:
        add("ONE ASK", "WARN", f"행동 요청 {len(asks)}개 ({', '.join(asks)}). "
                               "두 개를 요청하면 아무것도 안 한 것과 같음")

    density = len(emoji) * 100 / max(chars, 1)
    add("EMOJI", "WARN" if density > 4 else "PASS",
        f"이모지 {len(emoji)}개, 100자당 {density:.1f}개"
        + (" - 장식처럼 보임" if density > 4 else ""))

    if keywords:
        low = stripped.lower()
        found = [k for k in keywords if k.lower() in low]
        missing = [k for k in keywords if k.lower() not in low]
        in_window = [k for k in found if k.lower() in window.lower()]
        status = "PASS" if not missing else ("WARN" if found else "FAIL")
        add("SEARCH TERMS", status,
            f"{len(keywords)}개 중 {len(found)}개 있음"
            + (f", 보이는 부분에 {len(in_window)}개" if found else "")
            + (f". 빠짐: {', '.join(missing)}" if missing else ""))

    fails = sum(1 for c in checks if c["status"] == "FAIL")
    warns = sum(1 for c in checks if c["status"] == "WARN")
    verdict = "FIX" if fails else ("REVIEW" if warns else "READY")

    return {
        "characters": chars, "limit": LIMIT, "truncate_at": cut,
        "visible": window, "truncated": truncated,
        "first_line_chars": len(first_line),
        "hashtags": tags, "mentions": mentions, "links": links,
        "emoji": len(emoji), "asks": asks,
        "checks": checks, "verdict": verdict,
    }


CHECK_KO = {"LENGTH": "길이", "FIRST LINE": "첫 줄", "HOOK IS CONCRETE": "구체적인 첫머리",
            "HASHTAGS": "해시태그", "TAG PLACEMENT": "태그 위치", "LINKS": "링크", "ONE ASK": "행동 요청 하나",
            "EMOJI": "이모지", "SEARCH TERMS": "검색어"}
STATUS_KO = {"PASS": "통과", "WARN": "주의", "FAIL": "실패"}
VERDICT_KO = {"READY": "올려도 됨", "REVIEW": "다시 보기", "FIX": "고치기"}


def render(a, out=sys.stdout):
    head = (f"캡션 점검  ·  {a['characters']} / {a['limit']}자  ·  "
            f"해시태그 {len(a['hashtags'])}개  ·  행동 요청 {len(a['asks'])}개")
    print("\n" + head, file=out)
    print("=" * max(len(head), 62), file=out)
    render_box(a["visible"], a["truncated"], out=out)
    print("", file=out)
    for c in a["checks"]:
        print(f"  {STATUS_KO[c['status']]:<3} {CHECK_KO[c['check']]:<10} {c['detail']}", file=out)
    print("-" * 62, file=out)
    print(f"  판정  {VERDICT_KO[a['verdict']]}\n", file=out)


def main():
    ap = argparse.ArgumentParser(description="Lint an Instagram caption.")
    ap.add_argument("input", nargs="?", default="-", help="caption file, or - for stdin")
    ap.add_argument("--truncate", type=int, default=TRUNCATE,
                    help=f"characters shown before '... more' (default {TRUNCATE})")
    ap.add_argument("--keywords", default="", help="comma-separated terms you want to be found for")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    raw = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
    a = analyse(raw, cut=args.truncate, keywords=args.keywords.split(","))
    if args.json:
        print(json.dumps(a, indent=2, ensure_ascii=False))
    else:
        render(a)
    sys.exit(0 if a["verdict"] == "READY" else 1)


if __name__ == "__main__":
    main()
