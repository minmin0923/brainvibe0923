#!/usr/bin/env python3
"""
beats.py - turn a Reel script into a timed beat sheet before you record it.

Estimates how long each line takes to say, stacks them into timecodes, and
flags the four things that kill a Reel in the edit: a hook that runs past the
three-second mark, a beat long enough for the viewer to leave, a run of lines
with nothing concrete in them, and a total length that does not match what you
said you were making.

The timings are an estimate from word count at a words-per-minute rate. They
are close enough to plan an edit and not a substitute for recording it. Set
your own rate with --wpm once you have timed yourself reading a script out
loud: most people land between 150 and 200, and the default here is 165.

Usage
  python3 beats.py script.txt
  python3 beats.py script.txt --target 30
  python3 beats.py script.txt --wpm 185 --target 45
  pbpaste | python3 beats.py -
  python3 beats.py script.txt --json
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ko  # noqa: E402  한국어 처리

WORD_RE = re.compile(r"[A-Za-z0-9$%'’-]+")
SENT_RE = re.compile(r"[^.!?]+[.!?]*")
CONCRETE_RE = re.compile(r"\$\s?\d|\d[\d,.]*|(?<!^)\b[A-Z][a-z]{2,}\b", re.MULTILINE)
KO = {"on": False}       # 대본이 한국어면 True. 한국어는 음절 수로 시간을 잰다.
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "for",
    "with", "that", "this", "it", "is", "are", "was", "were", "be", "been",
    "you", "your", "i", "my", "me", "we", "our", "they", "them", "he", "she",
    "so", "just", "not", "no", "do", "did", "does", "have", "has", "had",
    "will", "can", "at", "as", "by", "from", "out", "up", "off", "one", "all",
}

HOOK_WINDOW = 3.0        # seconds. Past this, the thumb has already decided.
MAX_BEAT = 4.0           # seconds on one idea with no change on screen.
ABSTRACT_RUN = 3         # beats in a row with nothing checkable in them.


def words(text):
    # "$18,000" is one word when it is spoken, so it is one word here too.
    return WORD_RE.findall(re.sub(r"(?<=\d),(?=\d)", "", text))


def units(text):
    """시간 계산 단위: 한국어는 음절, 영어는 낱말."""
    return ko.syllables(text) if KO["on"] else len(words(text))


def concrete(text):
    n = len(CONCRETE_RE.findall(text))
    if KO["on"]:
        n += len(ko.SPOKEN_NUM_KO.findall(text)) + len(set(ko.NAME_EN.findall(text)))
    return n


def pretty(token):
    """Put the thousands separator back for display."""
    return re.sub(r"(\d)(?=(\d{3})+$)", r"\1,", token)


def tc(seconds):
    m, s = divmod(seconds, 60)
    return f"{int(m)}:{s:04.1f}"


def split_beats(raw, wps):
    """One line is one beat, unless a line is too long to be one."""
    beats = []
    for line in [l.strip() for l in raw.splitlines()]:
        if not line:
            continue
        if units(line) / wps <= MAX_BEAT * 1.5:
            beats.append(line)
            continue
        # Long paragraph: break it at sentence ends so the timings mean
        # something, and let the report say it was split.
        parts = [p.strip() for p in SENT_RE.findall(line) if p.strip()]
        buf = ""
        for part in parts:
            candidate = (buf + " " + part).strip()
            if buf and units(candidate) / wps > MAX_BEAT:
                beats.append(buf)
                buf = part
            else:
                buf = candidate
        if buf:
            beats.append(buf)
    return beats


def analyse(raw, wpm=165, target=None, sps=None):
    KO["on"] = ko.is_ko(raw)
    # 한국어는 초당 음절(sps), 영어는 분당 낱말(wpm)
    wps = (sps or ko.SYLLABLES_PER_SEC) if KO["on"] else wpm / 60.0
    beats = split_beats(raw, wps)
    if not beats:
        return None

    rows, clock = [], 0.0
    for i, text in enumerate(beats):
        n = units(text)
        dur = n / wps
        rows.append({
            "n": i + 1,
            "start": round(clock, 2),
            "dur": round(dur, 2),
            "words": n,
            "text": text,
            "concrete": concrete(text),
            "label": "",
            "flags": [],
        })
        clock += dur
    total = clock

    # Label the structural positions a Reel is actually built around.
    for r in rows:
        if r["n"] == 1 or r["start"] + r["dur"] <= HOOK_WINDOW:
            r["label"] = "HOOK"
    rows[-1]["label"] = "CTA" if rows[-1]["label"] != "HOOK" else "HOOK/CTA"
    half = total / 2
    for r in rows:
        if not r["label"] and r["start"] <= half < r["start"] + r["dur"]:
            r["label"] = "MID"

    notes = []
    if rows[0]["dur"] > HOOK_WINDOW:
        unit = "음절" if KO["on"] else "낱말"
        rows[0]["flags"].append(f"훅이 {rows[0]['dur']:.1f}초, {HOOK_WINDOW:.0f}초를 넘김")
        notes.append(f"1번 비트를 말하는 데 {rows[0]['dur']:.1f}초 걸림. "
                     f"{int(HOOK_WINDOW * wps)}{unit} 이하로 줄이기. 아니면 시청자가 넘길지 정한 뒤에 훅이 나옴.")
    if rows[0]["concrete"] == 0:
        notes.append("1번 비트에 숫자도 이름도 없음. 확인할 거리가 없는 훅은 넘겨진다.")

    for r in rows:
        if r["dur"] > MAX_BEAT:
            r["flags"].append(f"한 비트에 {r['dur']:.1f}초")
    long_beats = [r["n"] for r in rows if r["dur"] > MAX_BEAT]
    if long_beats:
        notes.append(f"{', '.join(map(str, long_beats))}번 비트가 {MAX_BEAT:.0f}초를 넘김. "
                     "문장을 나누거나 그 사이에 화면을 바꾸기. 멈춘 화면에서 사람들이 나간다.")

    run, start = 0, None
    for r in rows:
        if r["concrete"] == 0:
            run += 1
            start = start if start is not None else r["n"]
            if run == ABSTRACT_RUN:
                notes.append(f"{start}~{r['n']}번 비트에 구체적인 게 없음. "
                             "그중 하나에 숫자, 이름, 가격을 넣기.")
        else:
            run, start = 0, None

    # Does the last line hand you back to the first one?
    if KO["on"]:
        first = {w for w in ko.tokens(rows[0]["text"]) if w not in ko.STOP_KO and len(w) >= 2}
        last = {w for w in ko.tokens(rows[-1]["text"]) if w not in ko.STOP_KO and len(w) >= 2}
    else:
        first = {w.lower() for w in words(rows[0]["text"]) if w.lower() not in STOPWORDS}
        last = {w.lower() for w in words(rows[-1]["text"]) if w.lower() not in STOPWORDS}
    loop = sorted(pretty(w) for w in first & last)
    if loop:
        notes.append(f"루프 있음: 마지막 비트가 훅의 \"{', '.join(loop[:3])}\"을(를) 다시 말함. "
                     "다시 보기는 공짜 도달이다.")
    else:
        notes.append("루프 없음. 마지막 비트가 훅과 겹치는 말이 없어서 영상이 밋밋하게 끝남. "
                     "1번 비트의 낱말 하나를 되풀이하는 게 가장 싼 다시 보기 장치다.")

    if target:
        delta = total - target
        if abs(delta) <= target * 0.1:
            notes.append(f"길이가 목표에 맞음 (목표 {target}초, 예상 {total:.1f}초).")
        elif delta > 0:
            notes.append(f"목표보다 {delta:.1f}초 김. 약 {int(delta * wps)}{'음절' if KO['on'] else '낱말'} 줄이기.")
        else:
            notes.append(f"목표보다 {-delta:.1f}초 짧음. {int(-delta * wps)}{'음절' if KO['on'] else '낱말'}을 더하거나 "
                         "짧게 찍기. 대개 짧은 쪽이 맞다.")

    return {
        "wpm": wpm, "rate": round(wps, 2), "target": target,
        "total_seconds": round(total, 2),
        "total_words": sum(r["words"] for r in rows),
        "beats": rows,
        "notes": notes,
    }


def render(a, out=sys.stdout):
    unit = "음절" if KO["on"] else "낱말"
    rate = f"초당 {a['rate']}음절" if KO["on"] else f"분당 {a['wpm']}낱말"
    head = (f"비트 시트  ·  {a['total_words']}{unit}  ·  약 {a['total_seconds']:.1f}초 "
            f"({rate})" + (f"  ·  목표 {a['target']}초" if a["target"] else ""))
    print("\n" + head, file=out)
    print("=" * 72, file=out)
    for r in a["beats"]:
        name = {"HOOK": "훅", "MID": "중간", "CTA": "행동요청", "HOOK/CTA": "훅/요청"}.get(r["label"], "")
        label = name + " " * (8 - 2 * len(name)) if name else " " * 8
        print(f"  {tc(r['start'])}  {r['dur']:4.1f}초  {label}{r['text']}", file=out)
        for f in r["flags"]:
            print(f"  {'':>6}  {'':>5}  {'':<8}^ {f}", file=out)
    print("-" * 72, file=out)
    for n in a["notes"]:
        print(f"  - {n}", file=out)
    print("", file=out)


def main():
    ap = argparse.ArgumentParser(description="Time a Reel script into a beat sheet.")
    ap.add_argument("input", nargs="?", default="-", help="script file, or - for stdin")
    ap.add_argument("--wpm", type=float, default=165, help="speaking rate (default 165)")
    ap.add_argument("--target", type=float, help="target length in seconds")
    ap.add_argument("--sps", type=float, help="한국어 말하기 속도, 초당 음절 (기본 6.5)")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    raw = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
    a = analyse(raw, wpm=args.wpm, target=args.target, sps=args.sps)
    if not a:
        print("empty script", file=sys.stderr)
        sys.exit(2)
    if args.json:
        print(json.dumps(a, indent=2, ensure_ascii=False))
    else:
        render(a)
    sys.exit(0)


if __name__ == "__main__":
    main()
