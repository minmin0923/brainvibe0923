#!/usr/bin/env python3
"""swipe.py - rank collected videos by how far each beat its OWN channel, then name the formula.

    python3 swipe.py collected.json
    python3 swipe.py collected.json --min 2.0 --json

Input is a list you collected - one object per video:

    [{"channel":"Some Channel","title":"...","views":412000,"url":"...","duration":613}, ...]

Raw view counts rank channel size, not ideas. A 400k video on a 2M-subscriber channel is a normal
Tuesday; a 400k video on a channel whose median is 30k is the thing worth studying. So every video
is scored as a MULTIPLE OF ITS OWN CHANNEL'S MEDIAN, which needs at least four videos per channel
to mean anything - the tool says so rather than quietly ranking on noise.

The formula comes from skills/yt-script/hooks.json, matched against the TITLE. It is a judgement
about the words on screen, not a claim about why the video worked.
"""
import json, os, re, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "yt-script"))
import ko  # noqa: E402
FORMULAS = json.load(open(os.path.join(HERE, "..", "yt-script", "hooks.json"), encoding="utf-8"))["hooks"]

def classify(title):
    best, _ = ko.classify(title, FORMULAS)
    return best.get("name_ko", best["name"]) if best else "분류 안 됨"

def main():
    a = sys.argv[1:]
    as_json = "--json" in a; a = [x for x in a if x != "--json"]
    lo = float(a[a.index("--min") + 1]) if "--min" in a else 1.5
    files = [x for x in a if not x.startswith("--") and not re.match(r"^[\d.]+$", x)]
    if not files or not os.path.exists(files[0]): print(__doc__); sys.exit(1)
    rows = json.load(open(files[0], encoding="utf-8"))
    if isinstance(rows, dict): rows = rows.get("videos", [])
    by = {}
    for r in rows: by.setdefault(r.get("channel", "?"), []).append(r)
    out, thin = [], []
    for ch, vids in by.items():
        views = [float(v.get("views", 0) or 0) for v in vids]
        med = statistics.median(views) if views else 0
        if len(vids) < 4:
            thin.append((ch, len(vids)))
            continue
        for v in vids:
            m = (float(v.get("views", 0) or 0) / med) if med else 0
            out.append({"channel": ch, "title": v.get("title", ""), "views": int(v.get("views", 0) or 0),
                        "median": int(med), "multiple": round(m, 2),
                        "formula": classify(v.get("title", "")), "url": v.get("url", "")})
    out = [r for r in out if r["multiple"] >= lo]
    out.sort(key=lambda r: -r["multiple"])
    if as_json: print(json.dumps({"outliers": out, "skipped_thin_channels": thin}, indent=1, ensure_ascii=False)); return
    print(f"\n  채널 {len(by)}곳의 영상 {len(rows)}개 중, 채널 중앙값의 {lo}배 이상만 표시\n")
    for r in out[:25]:
        print(f"    {r['multiple']:5.2f}배  {r['views']:>9,}회  (채널 중앙값 {r['median']:>9,})   {r['channel'][:22]:<22} {r['title'][:52]}")
        print(f"            공식: {r['formula']}")
    if not out: print("    기준을 넘은 영상 없음 - 채널마다 영상을 더 모으거나 --min 을 낮추기")
    if thin:
        print(f"\n  영상이 4개 미만인 채널 {len(thin)}곳은 뺐음 - 영상 한두 개로는 중앙값이 의미 없음: "
              + ", ".join(f"{c} ({n})" for c, n in thin[:6]))
    counts = {}
    for r in out: counts[r["formula"]] = counts.get(r["formula"], 0) + 1
    if counts:
        print("\n  급상승 영상들이 쓴 제목 공식")
        for f, n in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"    {n:2d}개  {f}")
    print()

if __name__ == "__main__":
    main()
