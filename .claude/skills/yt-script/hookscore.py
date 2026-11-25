#!/usr/bin/env python3
"""hookscore.py - score a YouTube hook before you waste a take on it.

Five properties, 0-100 each, and a verdict that is 60% the mean and 40% the weakest one. The
weakest-link weighting is deliberate: a hook with four strong properties and one dead one is a hook
that leaks at the dead one, and averaging hides that.

    python3 hookscore.py hooks.txt            # one hook per line, ranked
    python3 hookscore.py --hook "one line"    # score a single hook
    python3 hookscore.py --json hooks.txt     # machine-readable

WHAT THIS CAN AND CANNOT TELL YOU. Measured against 74 real short-form hooks (first 15 seconds of
auto-captions, top-8 and bottom-8 by views across five channels): it separates deliberately bad
hooks from real ones well, and it separates a creator's own hits from their own misses barely at
all. Treat a low score as a reason to look again, never a high score as a promise.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ko  # noqa: E402  한국어 낱말 목록과 조사 처리
FORMULAS = json.load(open(os.path.join(HERE, "hooks.json"), encoding="utf-8"))["hooks"]

FILLER = {"basically","actually","literally","just","really","very","so","kind","sort","like",
          "guys","hey","welcome","today","video","subscribe","channel"}
VAGUE = {"amazing","incredible","insane","crazy","huge","massive","game","changer","secret",
         "powerful","ultimate","best","revolutionary","mind","blowing","unbelievable"}
CONCRETE = re.compile(r"\b(\d[\d,.]*\s?(%|k|m|x|s|m|h)?|\$\d|\d+\s?(second|minute|hour|day|week|month|year)s?)\b", re.I)
YOU = re.compile(r"\b(you|your|you're|youre|yourself)\b", re.I)
STAKE = re.compile(r"\b(lose|lost|wasting|waste|quit|fail|broke|cost|risk|before|stop|never|die|dying|dead)\b", re.I)
CURIOSITY = re.compile(r"\b(why|how|what|which|until|before|but|nobody|almost|except|reason|actually)\b", re.I)

def words(t): return ko.tokens(t)

def specificity(t):
    w = words(t)
    if not w: return 0
    if ko.is_ko(t):
        nums = len([m for m in ko.CONCRETE_KO.finditer(t) if m.group(0).strip()])
        vague = sum(1 for x in ko.VAGUE_KO if x in t)
        filler = sum(1 for x in ko.FILLER_KO if x in t)
        s = 34 + nums * 22 - vague * 16 - filler * 5
        # 한국어 문장 속 영문 고유명사(Claude, GPT, YouTube)는 이름이 붙은 것으로 본다
        s += min(18, 6 * len(re.findall(r"\b[A-Z][A-Za-z0-9]+", t)))
        return max(0, min(100, s))
    nums = len(CONCRETE.findall(t))
    vague = sum(1 for x in w if x in VAGUE)
    filler = sum(1 for x in w if x in FILLER)
    s = 34 + nums * 22 - vague * 16 - filler * 5
    # proper nouns that are not sentence-initial read as named things
    s += min(18, 6 * sum(1 for x in t.split()[1:] if x[:1].isupper()))
    return max(0, min(100, s))

def address(t):
    if ko.is_ko(t):
        n = len(ko.YOU_KO.findall(t))
        first = 30 if ko.YOU_KO.search(" ".join(t.split()[:4])) else 0
        return max(0, min(100, 26 + n * 20 + first))
    n = len(YOU.findall(t))
    first = 30 if YOU.search(" ".join(t.split()[:6])) else 0
    return max(0, min(100, 26 + n * 20 + first))

def stakes(t):
    if ko.is_ko(t):
        n = len(ko.STAKE_KO.findall(t))
        conc = any(m.group(0).strip() for m in ko.CONCRETE_KO.finditer(t))
        return max(0, min(100, 22 + n * 26 + (14 if conc else 0)))
    n = len(STAKE.findall(t))
    return max(0, min(100, 22 + n * 26 + (14 if CONCRETE.search(t) else 0)))

def curiosity(t):
    q = 18 if t.strip().endswith("?") else 0
    if ko.is_ko(t):
        n = len(ko.CURIOSITY_KO.findall(t))
        # '~인데요', '~는데' 로 끝나면 말을 열어 둔 것이다
        q += 10 if re.search(r"(는데|인데)(요)?[.!…]*$", t.strip()) else 0
        closed = -18 if ko.CLOSED_KO.search(t) else 0
        return max(0, min(100, 24 + n * 17 + q + closed))
    n = len(CURIOSITY.findall(t))
    # a hook that resolves itself has no gap left
    closed = -18 if re.search(r"\b(because|so that|which means)\b", t, re.I) else 0
    return max(0, min(100, 24 + n * 17 + q + closed))

def brevity(t):
    if ko.is_ko(t):
        # 한국어는 낱말 수보다 글자 수가 말하는 시간에 가깝다. 초당 약 6~7글자,
        # 10초 안에 끝나는 훅은 대략 18~60글자다.
        n = ko.syllables(t)
        if 18 <= n <= 60: return 100
        if n < 18: return max(30, 100 - (18 - n) * 6)
        return max(10, 100 - (n - 60) * 3)
    n = len(words(t))
    if n == 0: return 0
    # 9-24 words is the band a spoken hook lands in at ~150wpm inside 10 seconds
    if 9 <= n <= 24: return 100
    if n < 9:  return max(30, 100 - (9 - n) * 11)
    return max(10, 100 - (n - 24) * 7)

PROPS = [("SPECIFICITY", specificity), ("ADDRESS", address), ("STAKES", stakes),
         ("CURIOSITY", curiosity), ("BREVITY", brevity)]

def classify(t):
    best, hits = ko.classify(t, FORMULAS)
    if not best: return "분류 안 됨", 0
    return f'{best.get("name_ko", best["name"])} ({best["name"]})', hits

def score(t):
    parts = {n: fn(t) for n, fn in PROPS}
    vals = list(parts.values())
    verdict = round(0.6 * (sum(vals) / len(vals)) + 0.4 * min(vals))
    name, hits = classify(t)
    return parts, verdict, name, hits

def band(v): return "강함" if v >= 72 else "쓸 만함" if v >= 55 else "약함"

LABEL = {"SPECIFICITY": "구체성", "ADDRESS": "말 걸기", "STAKES": "걸린 것",
         "CURIOSITY": "궁금증", "BREVITY": "짧음"}

def report(t, parts, verdict, name, hits):
    print(f"\n  {t.strip()}")
    print(f"  {'-' * min(72, max(20, len(t.strip())))}")
    for k, v in parts.items():
        print(f"    {LABEL[k]:<6} {v:3d}  {'#' * (v // 5)}")
    print(f"    {'종합':<6} {verdict:3d}  {band(verdict)}")
    print(f"    공식    {name}" + (f"  (패턴 {hits}개 일치)" if hits else "  (맞는 공식 없음 - 대개 훅이 아니라 요약이라는 뜻)"))
    low = min(parts, key=parts.get)
    print(f"    약점    {LABEL[low]} - {FIX[low]}")

FIX = {
 "SPECIFICITY": "꾸밈말 하나를 숫자, 이름, 날짜로 바꾸기",
 "ADDRESS": "첫머리에서 '여러분'이나 대상(초보자, 사장님)을 부르기",
 "STAKES": "지금 방식을 계속하면 무엇을 잃는지 말하기",
 "CURIOSITY": "스스로 답해 버리는 뒷부분('~때문에', '그래서')을 자르기",
 "BREVITY": "한국어는 18~60글자(영어 9~24낱말). 소리 내어 읽고 숨이 찰 때 끊기",
}

def main():
    a = sys.argv[1:]
    as_json = "--json" in a
    a = [x for x in a if x != "--json"]
    if "--hook" in a:
        lines = [a[a.index("--hook") + 1]]
    elif a and os.path.exists(a[0]):
        lines = [l for l in open(a[0], encoding="utf-8").read().splitlines() if l.strip()]
    else:
        print(__doc__); sys.exit(1 if not a else 0)
    out = []
    for t in lines:
        parts, verdict, name, hits = score(t)
        out.append({"hook": t.strip(), "properties": parts, "verdict": verdict,
                    "band": band(verdict), "formula": name, "matched": hits})
    out.sort(key=lambda r: -r["verdict"])
    if as_json:
        print(json.dumps([{k: v for k, v in r.items() if k != "matched"} for r in out], indent=1, ensure_ascii=False)); return
    for r in out:
        report(r["hook"], r["properties"], r["verdict"], r["formula"], r["matched"])
    if len(out) > 1:
        print(f"\n  1위: {out[0]['hook'].strip()}  ({out[0]['verdict']}, {out[0]['band']})\n")

if __name__ == "__main__":
    main()
