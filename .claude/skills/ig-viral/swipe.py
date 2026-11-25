#!/usr/bin/env python3
"""
swipe.py - rank reels you collected by how far they beat their own account,
name the hook formula each one used, and write the swipe file.

The point of this script is one correction: raw views are not evidence. A
2,000,000-follower account doing 400,000 views had a quiet day. A 4,000-
follower account doing 400,000 views found something. This ranks on the
multiple over the account's own baseline, which is the only version of
"went viral" that tells you anything you can copy.

Input is a tab-separated file you fill in while you browse, one reel per row,
with a header line naming the columns:

    account   followers   median   views    hook
    @someone  48000       11000    412000   nobody tells you your first 30 flop

`median` is that account's typical recent views and is the better baseline.
If you only have `followers`, leave median out and the script says so.
`hook` is the first line of the reel, spoken or on screen, in their words.

Usage
  python3 swipe.py captured.tsv
  python3 swipe.py captured.tsv --out ~/.claude/instagram/swipe.md
  python3 swipe.py captured.tsv --json
"""

import argparse
import json
import os
import re
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
HOOKS = os.path.join(HERE, "..", "ig-reel", "hooks.json")
WORD_RE = re.compile(r"[A-Za-z0-9$%'’-]+")

try:                                              # optional: score the hooks too
    sys.path.insert(0, os.path.join(HERE, "..", "ig-reel"))
    from hookscore import run as score_hook       # noqa: E402
except Exception:                                 # ig-viral copied on its own
    score_hook = None
try:
    import ko                                     # noqa: E402  ig-reel/ko.py
except Exception:
    ko = None

# 한국어 열 이름도 받는다
HEADER_KO = {"계정": "account", "아이디": "account", "팔로워": "followers", "팔로워수": "followers",
             "중앙값": "median", "평균": "median", "보통조회수": "median", "조회수": "views",
             "훅": "hook", "첫문장": "hook", "첫 문장": "hook"}
VERDICT_KO = {"STRONG": "강함", "OK": "쓸 만함", "WEAK": "약함"}


def count(s):
    """'41.2만', '12K', '412,000' 모두 읽는다."""
    if ko:
        return ko.parse_count(s)
    digits = re.sub(r"[^\d]", "", s or "")
    return int(digits) if digits else None


def load_formulas(path):
    try:
        d = json.load(open(path, encoding="utf-8"))
    except Exception:
        return None
    by_id = {h["id"]: h for h in d["hooks"]}
    order = d.get("classify_order") or sorted(by_id)
    out = []
    for i in order:
        if i not in by_id:
            continue
        h = by_id[i]
        pats = [re.compile(h["match"], re.IGNORECASE)]
        if h.get("match_ko"):
            pats.append(re.compile(h["match_ko"], re.IGNORECASE))
        out.append((h["id"], h.get("name_ko") or h["name"], pats))
    return out


def classify(hook, formulas):
    if not formulas:
        return None, "분류 안 됨"
    for fid, name, patterns in formulas:
        if any(p.search(hook) for p in patterns):
            return fid, name
    return None, "분류 안 됨"


def read_rows(path):
    raw = sys.stdin.read() if path == "-" else open(path, encoding="utf-8").read()
    lines = [l for l in raw.splitlines() if l.strip() and not l.lstrip().startswith("#")]
    if not lines:
        return []
    head = [HEADER_KO.get(c.strip(), c.strip().lower()) for c in lines[0].split("\t")]
    if "views" in head and "hook" in head:
        cols, body = head, lines[1:]
    else:
        cols, body = ["account", "followers", "views", "hook"], lines
    rows = []
    for line in body:
        cells = line.split("\t")
        if len(cells) < len(cols):
            cells += [""] * (len(cols) - len(cells))
        r = dict(zip(cols, [c.strip() for c in cells]))
        r["views"] = count(r.get("views", "")) or 0
        for k in ("followers", "median"):
            r[k] = count(r.get(k, "") or "")
        if r["views"] and r.get("hook"):
            rows.append(r)
    return rows


def analyse(rows, formulas):
    used_median = any(r.get("median") for r in rows)
    for r in rows:
        base = r.get("median") or r.get("followers") or 0
        r["baseline"] = base
        r["outlier"] = round(r["views"] / base, 2) if base else None
        r["formula_id"], r["formula"] = classify(r["hook"], formulas)
        # 한국어 훅은 음절 수, 영어 훅은 낱말 수
        r["words"] = (ko.syllables(r["hook"]) if ko and ko.is_ko(r["hook"])
                      else len(WORD_RE.findall(r["hook"])))
        if score_hook:
            _, overall, verdict, _ = score_hook(r["hook"])
            r["hook_score"], r["hook_verdict"] = round(overall, 1), verdict
        else:
            r["hook_score"], r["hook_verdict"] = None, None
    ranked = sorted(rows, key=lambda r: -(r["outlier"] or 0))
    third = max(1, len(ranked) // 3)
    top, bottom = ranked[:third], ranked[-third:]

    def med(items, key):
        vals = [i[key] for i in items if i.get(key) is not None]
        return round(statistics.median(vals), 1) if vals else None

    counts = {}
    for r in top:
        counts[r["formula"]] = counts.get(r["formula"], 0) + 1
    return {
        "baseline": "account median" if used_median else "follower count",
        "n": len(ranked),
        "accounts": len({r.get("account", "") for r in ranked}),
        "reels": ranked,
        "top_formulas": sorted(counts.items(), key=lambda kv: -kv[1]),
        "top_hook_score": med(top, "hook_score"),
        "bottom_hook_score": med(bottom, "hook_score"),
        "top_words": med(top, "words"),
        "bottom_words": med(bottom, "words"),
        "unclassified": sum(1 for r in ranked if r["formula"] == "분류 안 됨"),
    }


BASE_KO = {"account median": "계정 중앙값", "follower count": "팔로워 수"}


def render(a, out=sys.stdout):
    head = (f"스와이프 파일  ·  릴스 {a['n']}개  ·  계정 {a['accounts']}곳  ·  "
            f"기준: {BASE_KO[a['baseline']]}")
    print("\n" + head, file=out)
    print("=" * 78, file=out)
    for r in a["reels"]:
        mult = f"{r['outlier']:.1f}배" if r["outlier"] else "   ?"
        score = f"{r['hook_score']:.0f}" if r["hook_score"] is not None else " -"
        fid = f"#{r['formula_id']:<2}" if r["formula_id"] else "-  "
        print(f"  {mult:>7}  훅 {score:>3}점  {fid} {r['formula'][:14]:<14} "
              f"{r.get('account', '')[:16]:<16} {r['views']:>9,}회", file=out)
        print(f"           \"{r['hook'][:80]}\"", file=out)
    print("-" * 78, file=out)
    print("이번 묶음에서 잘 되는 것", file=out)
    if a["top_formulas"]:
        print("  배수 상위 1/3의 공식:  "
              + ", ".join(f"{n} {c}개" for n, c in a["top_formulas"][:4]), file=out)
    if a["top_hook_score"] is not None:
        print(f"  훅 점수 중앙값:        상위 {a['top_hook_score']:.0f}  "
              f"vs 하위 {a['bottom_hook_score']:.0f}", file=out)
    print(f"  훅 길이 중앙값:        상위 {a['top_words']}  vs 하위 {a['bottom_words']}"
          "  (한국어는 음절, 영어는 낱말)", file=out)
    print(f"  분류 안 됨:            {a['n']}개 중 {a['unclassified']}개. 직접 읽어 보기. "
          "아직 목록에 없는 공식이 여기 숨어 있다.", file=out)
    print("\n  손으로 모은 묶음은 근거이지 증명이 아니다. 릴스 12개로는 아무것도 모르고,\n"
          "  6개 계정에서 40개쯤 모아야 뭔가 보인다. 믿기 전에 더 모으기.\n", file=out)


def to_markdown(a):
    lines = ["# 스와이프 파일", "",
             f"계정 {a['accounts']}곳의 릴스 {a['n']}개. "
             f"{BASE_KO[a['baseline']]} 대비 배수로 정렬.", ""]
    for r in a["reels"]:
        mult = f"{r['outlier']:.1f}배" if r["outlier"] else "?"
        lines += [f"## {mult}  {r['formula']}  ({r.get('account', '')})",
                  f"- 조회수: {r['views']:,}  기준: {r['baseline']:,}",
                  f"- 훅 점수: {r['hook_score']}  길이: {r['words']}",
                  f"- 훅: \"{r['hook']}\"", ""]
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Rank collected reels by outlier multiple.")
    ap.add_argument("input", nargs="?", default="-", help="TSV file, or - for stdin")
    ap.add_argument("--hooks", default=HOOKS, help="path to ig-reel/hooks.json")
    ap.add_argument("--out", help="also write the swipe file as markdown here")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    rows = read_rows(args.input)
    if not rows:
        print("읽을 수 있는 줄이 없음. 탭으로 나눈 파일에 최소한 조회수(views)와 훅(hook) 열이 필요함.",
              file=sys.stderr)
        sys.exit(2)
    formulas = load_formulas(args.hooks)
    a = analyse(rows, formulas)
    if not formulas:
        print("note: hooks.json not found, formulas not named. Pass --hooks.", file=sys.stderr)
    if score_hook is None:
        print("note: hookscore.py not importable, hook scores skipped.", file=sys.stderr)

    if args.json:
        print(json.dumps(a, indent=2, ensure_ascii=False))
    else:
        render(a)
    if args.out:
        path = os.path.expanduser(args.out)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "w", encoding="utf-8").write(to_markdown(a))
        print(f"wrote {path}", file=sys.stderr)


if __name__ == "__main__":
    main()
