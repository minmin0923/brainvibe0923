#!/usr/bin/env python3
"""
detect.py - a five-check panel that scores how machine-written a draft looks.

What this is:  five local heuristics modelled on the signals public AI
detectors actually measure - sentence-length variation, concreteness, stock
vocabulary, typographic fingerprint, and voice. Every score is computed on
your machine from the text alone. Nothing is uploaded.

What this is NOT:  GPTZero, Originality, Copyleaks, Winston or Turnitin.
It does not call their APIs and it cannot promise their verdict. It catches
the things they all key on, which is why fixing them tends to move their
numbers too - but the only honest claim is the one on this line.

Each check returns a HUMAN score from 0 to 100. Higher is better.

Usage
  python3 detect.py draft.txt
  pbpaste | python3 detect.py -
  python3 detect.py draft.txt --json
  python3 detect.py before.txt after.txt      # compare two drafts
"""

import argparse
import json
import os
import re
import statistics
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
LEX = os.path.join(HERE, "slop.json")

SENT_RE = re.compile(r"[^.!?\n]+[.!?]*")
WORD_RE = re.compile(r"[A-Za-z']+")
CONTRACTIONS = re.compile(r"\b\w+'(?:s|t|re|ve|ll|d|m)\b", re.IGNORECASE)
PRONOUNS = re.compile(r"\b(i|me|my|mine|we|us|our|you|your)\b", re.IGNORECASE)
NUMBERS = re.compile(r"\b\d[\d,.]*%?\b|\$\d")
PROPER = re.compile(r"(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b", re.MULTILINE)

sys.path.insert(0, os.path.join(HERE, "..", "ig-reel"))
import ko  # noqa: E402  한국어 처리
# 한국어 구어체 끝맺음: 사람이 쓴 캡션은 끝맺음이 섞이고, 기계가 쓴 글은 '~습니다.'로 고르다.
KO_PRONOUNS = re.compile(r"(저는|제가|저도|제 |나는|내가|나도|우리|저희|여러분|당신|"
                         r"[가-힣]{2,}(?:분들|님들|이라면|라면))")


def lex_pattern(find):
    """사전 항목의 정규식. 한국어 항목은 낱말 경계(\\b) 없이 찾는다: 한국어는 조사가 바로 붙기 때문."""
    body = re.escape(find).replace(r"\ ", r"\s+")
    if re.search(r"[가-힣]", find):
        return re.compile(body)
    return re.compile(r"\b" + body + r"\b", re.IGNORECASE)


def clamp(n):
    return max(0.0, min(100.0, n))


def scale(value, human, machine):
    """Map value onto 0-100 where `human` -> 100 and `machine` -> 0."""
    if human == machine:
        return 50.0
    return clamp((value - machine) / (human - machine) * 100)


def sentences(text):
    return [s.strip() for s in SENT_RE.findall(text) if len(s.split()) > 2]


def words(text):
    if ko.is_ko(text):
        return ko.eojeol(text)          # 한국어는 어절 단위
    return WORD_RE.findall(text)


def ending(sentence):
    """문장 끝맺음 종류: 습니다/입니다, 요, 죠, 다, 기타."""
    t = re.sub(r"[.!?~…\s]+$", "", sentence.strip())
    for name, pat in (("습니다", r"(습니다|ㅂ니다|입니다|십시오)$"), ("죠", r"죠$"), ("요", r"요$"),
                      ("다", r"다$"), ("명사", r"[가-힣]$")):
        if re.search(pat, t):
            return name
    return "기타"


def check_burstiness(text):
    """Humans vary sentence length hard. Models write even."""
    if ko.is_ko(text):
        # 한국어는 어절이 적어서 짧은 문장('범위는 숫자로.')이 빠지지 않도록 음절로 잰다.
        lens = [ko.syllables(s) for s in SENT_RE.findall(text) if ko.syllables(s) >= 4]
    else:
        lens = [len(s.split()) for s in sentences(text)]
    if len(lens) < 4:
        return 50.0, "too short to judge" if not ko.is_ko(text) else "너무 짧아서 판단 못 함"
    mean = statistics.mean(lens)
    cv = statistics.pstdev(lens) / mean if mean else 0
    score = scale(cv, human=0.70, machine=0.22)
    if ko.is_ko(text):
        return score, f"문장 {len(lens)}개의 길이 변화 {cv:.2f} (0.55 이상이 좋음)"
    return score, f"variation {cv:.2f} across {len(lens)} sentences (want 0.55+)"


def check_specificity(text):
    """Numbers, names and concrete nouns. Slop is abstract."""
    w = words(text)
    if len(w) < 25:
        return 50.0, "too short to judge"
    per100 = 100 / len(w)
    if ko.is_ko(text):
        hits = (len([m for m in ko.CONCRETE_KO.finditer(text) if m.group(0).strip()])
                + len(ko.SPOKEN_NUM_KO.findall(text)) + len(set(ko.NAME_EN.findall(text))))
    else:
        hits = len(NUMBERS.findall(text)) + len(set(PROPER.findall(text)))
    density = hits * per100
    score = scale(density, human=6.0, machine=0.5)
    if ko.is_ko(text):
        return score, f"구체적인 표시 {hits}개, 100어절당 {density:.1f}개 (4 이상이 좋음)"
    return score, f"{hits} concrete markers, {density:.1f} per 100 words (want 4+)"


def check_slop(text, lex):
    """Stock vocabulary density against the lexicon."""
    w = words(text)
    if not w:
        return 50.0, "empty"
    hits, found = 0, []
    for entry in lex["words"] + lex["phrases"]:
        pattern = lex_pattern(entry["find"])
        n = len(pattern.findall(text))
        if n:
            hits += n
            found.append(entry["find"])
    density = hits * 100 / len(w)
    score = scale(density, human=0.0, machine=4.0)
    detail = (f"상투어 {hits}개, 100어절당 {density:.1f}개" if ko.is_ko(text)
              else f"{hits} stock terms, {density:.1f} per 100 words")
    if found:
        detail += " (" + ", ".join(sorted(found)[:4]) + (", ..." if len(found) > 4 else "") + ")"
    return score, detail


def check_fingerprint(text):
    """Characters a phone keyboard does not produce."""
    invisible = sum(1 for c in text if unicodedata.category(c) == "Cf")
    em = text.count("—")
    curly = sum(text.count(c) for c in "‘’“”")
    ellip = text.count("…")
    nbsp = sum(text.count(c) for c in "   ")
    total = invisible * 4 + em * 2 + curly + ellip + nbsp
    per1k = total * 1000 / max(len(text), 1)
    score = scale(per1k, human=0.0, machine=12.0)
    if ko.is_ko(text):
        detail = (f"보이지 않는 문자 {invisible}, 긴 줄표(—) {em}, 둥근 따옴표 {curly}, "
                  f"말줄임표(…) {ellip}, 붙은 공백 {nbsp}")
    else:
        detail = (f"{invisible} invisible, {em} em dash, {curly} curly quote, "
                  f"{ellip} ellipsis, {nbsp} hard space")
    return score, detail


def check_voice(text, lex):
    """Contractions, person, and the shapes models default to."""
    w = words(text)
    if len(w) < 25:
        return 50.0, "too short to judge"
    per100 = 100 / len(w)
    if ko.is_ko(text):
        # 영어의 축약형(don't) 대신, 한국어는 끝맺음이 얼마나 섞였는지와 사람 냄새 나는 말투를 본다.
        sents = [s for s in SENT_RE.findall(text) if s.strip()]
        kinds = [ending(s) for s in sents]
        top = max((kinds.count(k) for k in set(kinds)), default=0)
        mix = 1 - top / len(kinds) if kinds else 0          # 0 = 모두 같은 끝맺음
        casual = len(re.findall(r"(거든요|잖아요|더라고요|네요|ㅋㅋ|ㅎㅎ|ㅠㅠ|진짜|완전|ㄹㅇ)", text)) * per100
        contractions = mix * 6 + casual                      # 영어 기준(사람 3+)에 맞춘 값
        person = len(KO_PRONOUNS.findall(text)) * per100 * 1.5
    else:
        contractions = len(CONTRACTIONS.findall(text)) * per100
        person = len(PRONOUNS.findall(text)) * per100
    tells = 0
    names = []
    for s in lex["structures"]:
        try:
            n = len(re.compile(s["regex"], re.MULTILINE).findall(text))
        except re.error:
            continue
        if n:
            tells += n
            names.append(s["id"])
    bullets = [len(b.split()) for b in re.findall(r"(?m)^\s*[-*•]\s+(.+)$", text)]
    uniform = (len(bullets) >= 3 and statistics.pstdev(bullets) < 1.6)
    score = (scale(contractions, human=3.0, machine=0.0) * 0.35
             + scale(person, human=8.0, machine=1.0) * 0.35
             + clamp(100 - tells * 22) * 0.30)
    if uniform:
        score -= 12
        names.append("uniform-bullets")
    if ko.is_ko(text):
        detail = (f"끝맺음·구어체 지수 {contractions:.1f}, 인칭 표현 {person:.1f} (100어절당), "
                  f"기계식 문장 구조 {tells}개")
    else:
        detail = (f"{contractions:.1f} contractions, {person:.1f} personal pronouns "
                  f"per 100 words, {tells} structural tell(s)")
    if names:
        detail += " [" + ", ".join(names[:4]) + "]"
    return clamp(score), detail


CHECKS = ["BURSTINESS", "SPECIFICITY", "SLOP DENSITY", "FINGERPRINT", "VOICE"]


def run(text, lex):
    results = {}
    results["BURSTINESS"] = check_burstiness(text)
    results["SPECIFICITY"] = check_specificity(text)
    results["SLOP DENSITY"] = check_slop(text, lex)
    results["FINGERPRINT"] = check_fingerprint(text)
    results["VOICE"] = check_voice(text, lex)
    scores = [results[c][0] for c in CHECKS]
    # The weakest check drags the verdict: a detector only needs one signal.
    overall = statistics.mean(scores) * 0.6 + min(scores) * 0.4
    verdict = "PASS" if overall >= 70 and min(scores) >= 55 else (
        "REVIEW" if overall >= 50 else "FLAGGED")
    return results, overall, verdict


def bar(score, width=24):
    filled = round(score / 100 * width)
    return "#" * filled + "." * (width - filled)


LABEL_KO = {"BURSTINESS": "문장 길이 변화", "SPECIFICITY": "구체성", "SLOP DENSITY": "상투어",
            "FINGERPRINT": "기계 흔적", "VOICE": "말투"}
VERDICT_KO = {"PASS": "통과", "REVIEW": "다시 보기", "FLAGGED": "AI 같음"}


def render(results, overall, verdict, label=None, out=sys.stdout):
    title = "AI 글 판별" + (f"  -  {label}" if label else "")
    print("\n" + title, file=out)
    print("=" * max(len(title), 62), file=out)
    for name in CHECKS:
        score, detail = results[name]
        print(f"  {LABEL_KO[name]:<9} {bar(score)} {score:5.1f}", file=out)
        print(f"  {'':<9} {detail}", file=out)
    print("-" * 62, file=out)
    print(f"  {'사람 점수':<9} {bar(overall)} {overall:5.1f}   {VERDICT_KO[verdict]}", file=out)
    if verdict != "PASS":
        weakest = min(CHECKS, key=lambda c: results[c][0])
        print(f"\n  가장 약한 신호: {LABEL_KO[weakest]}. 그것부터 고치기.", file=out)
    print("", file=out)


def main():
    ap = argparse.ArgumentParser(description="Score how machine-written a draft looks.")
    ap.add_argument("input", nargs="?", default="-", help="file, or - for stdin")
    ap.add_argument("compare", nargs="?", help="second file, to show before/after")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--lexicon", default=LEX)
    args = ap.parse_args()

    lex = json.load(open(args.lexicon, encoding="utf-8"))
    read = lambda p: sys.stdin.read() if p == "-" else open(p, encoding="utf-8").read()

    targets = [(args.input, read(args.input))]
    if args.compare:
        targets.append((args.compare, read(args.compare)))

    payload = []
    for name, text in targets:
        results, overall, verdict = run(text, lex)
        payload.append({
            "source": name,
            "checks": {k: {"score": round(v[0], 1), "detail": v[1]} for k, v in results.items()},
            "human_score": round(overall, 1),
            "verdict": verdict,
        })

    if args.json:
        print(json.dumps(payload if args.compare else payload[0], indent=2, ensure_ascii=False))
        return

    for (name, text), p in zip(targets, payload):
        results, overall, verdict = run(text, lex)
        render(results, overall, verdict, label=os.path.basename(name) if args.compare else None)
    if args.compare:
        a, b = payload
        delta = b["human_score"] - a["human_score"]
        print(f"  {a['human_score']:.1f} {VERDICT_KO[a['verdict']]}  ->  "
              f"{b['human_score']:.1f} {VERDICT_KO[b['verdict']]}   ({delta:+.1f})\n")

    sys.exit(0 if payload[-1]["verdict"] == "PASS" else 1)


if __name__ == "__main__":
    main()
