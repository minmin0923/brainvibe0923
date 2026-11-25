#!/usr/bin/env python3
"""title.py - 올리기 전에 유튜브 제목과 썸네일 문구를 한 쌍으로 점검한다. (한국어·영어)

    python3 title.py --title "..." --thumb "3시간 → 10분"
    python3 title.py titles.txt            # 한 줄에 제목 하나, 점수순 정렬
    python3 title.py --title "..." --json

점검 단위는 제목 하나가 아니라 '제목 + 썸네일 문구'다. 썸네일이 제목을 되풀이하면 클릭을 끌 자리의
절반을 같은 말에 쓰는 셈이고, 가장 흔한 실수가 이것이다.

길이: 유튜브는 데스크톱 검색에서 영문 약 60자, 모바일 홈 피드에서 약 40자 폭쯤에서 자른다. 한글은
영문보다 넓어서, 여기서는 한글 한 글자를 영문 1.7자 폭으로 계산한다(추정치). 그래서 한국어 제목은
데스크톱 약 35자, 모바일 약 23자 언저리에서 잘린다고 보면 된다. 실제 잘림은 기기와 글꼴마다 다르다.
"""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "yt-script"))
import ko  # noqa: E402

DESKTOP, MOBILE, HARD = 60, 40, 100
VAGUE = {"amazing","incredible","insane","crazy","huge","massive","ultimate","best","powerful",
         "secret","revolutionary","mindblowing","epic","perfect","complete","everything"}
STOP = {"the","a","an","of","for","to","in","on","and","or","is","are","with","your","you","my","i",
        "this","that","it","how","what","why"}

def words(t): return [w for w in ko.tokens(t)]

def cut_at(t, limit):
    """표시 폭이 limit에 닿기 직전까지 자른 앞부분."""
    out, w = "", 0.0
    for c in t:
        w += 1.7 if ko.is_wide(c) else 1
        if w > limit: break
        out += c
    return out.rsplit(" ", 1)[0] if " " in out else out

def check(title, thumb=None):
    t = title.strip()
    n, w = len(t), ko.width(t)
    korean = ko.is_ko(t)
    issues, good = [], []
    size = f"{n}자(표시 폭 {w})" if korean else f"{n}자"
    if n > HARD: issues.append(("길이", f"{n}자 - 유튜브 제목 한도는 {HARD}자"))
    elif w > DESKTOP: issues.append(("길이", f"{size} - 데스크톱 검색에서 뒷부분이 잘림(폭 {DESKTOP} 기준)"))
    else: good.append(f"{size}, 데스크톱 검색에서 안 잘림")
    if w > MOBILE:
        head = cut_at(t, MOBILE)
        issues.append(("모바일", f'모바일 피드에는 "{head}..."까지만 보임 - 주제가 이 안에 있는지 확인'))
    # 소리치는 제목: 영어는 대문자 낱말, 한국어는 !!·??·ㅋㅋ·【】
    caps = [x for x in t.split() if len(x) > 2 and x.isupper() and x.isascii()]
    shout = ko.SHOUT_KO.findall(t)
    if len(caps) > 2: issues.append(("과장 표기", f"대문자 낱말 {len(caps)}개 - 2개를 넘으면 광고처럼 보임"))
    elif caps: good.append(f"강조용 대문자 낱말 {len(caps)}개")
    if shout: issues.append(("과장 표기", f"{', '.join(sorted(set(shout)))} - 느낌표 남발, ㅋㅋ, 괄호 장식은 광고처럼 보임"))
    v = sorted({x for x in words(t) if x in VAGUE} | {x for x in ko.VAGUE_KO if x in t})
    if v: issues.append(("막연함", f"{', '.join(v)} - 숫자, 이름, 날짜로 바꾸기"))
    nums = re.findall(r"\d[\d,.]*%?", t)
    if nums: good.append(f"구체적인 숫자 있음({', '.join(nums[:3])})")
    else: issues.append(("숫자 없음", "숫자, 날짜, 이름이 없음 - 가장 확실한 한 가지 개선"))
    if t.endswith("?"): good.append("궁금증을 남기는 질문형 제목")
    first3 = words(t)[:3]
    front = [x for x in first3 if x not in STOP and x not in ko.STOP_KO]
    if first3 and not front:
        issues.append(("앞머리", "앞 세 낱말이 모두 군말 - 주제를 앞으로 당기기"))
    if thumb:
        tw = set(words(t)) - STOP - ko.STOP_KO
        hw = set(words(thumb)) - STOP - ko.STOP_KO
        shared = {x for x in hw if len(x) >= 2 and (x in tw or any(x in y or y in x for y in tw if len(y) >= 2))}
        if shared:
            issues.append(("중복", f"썸네일이 제목의 {', '.join(sorted(shared))}을(를) 되풀이함 - "
                                   "썸네일에는 제목에 없는 말을 넣기"))
        else:
            good.append("제목과 썸네일 문구가 서로 다른 말을 함")
        tn = len(thumb.split())
        tsyl = ko.syllables(thumb)
        if tn > 4 or (ko.is_ko(thumb) and tsyl > 12):
            issues.append(("썸네일 길이", f"썸네일 문구 {tn}낱말·{tsyl}글자 - 피드 크기에서는 3낱말(한글 약 10자)이 한계"))
    score = max(0, min(100, 100 - 14 * len(issues) + 4 * len(good)))
    return {"title": t, "chars": n, "width": w, "score": score, "issues": issues, "good": good}

def show(r):
    print(f'\n  "{r["title"]}"')
    print(f"  {r['chars']}자   점수 {r['score']}/100")
    for k, m in r["issues"]: print(f"    x  {k:<8} {m}")
    for m in r["good"]:      print(f"    ok           {m}")

def main():
    a = sys.argv[1:]
    as_json = "--json" in a; a = [x for x in a if x != "--json"]
    thumb = a[a.index("--thumb") + 1] if "--thumb" in a else None
    if "--title" in a:
        rows = [check(a[a.index("--title") + 1], thumb)]
    elif a and os.path.exists(a[0]):
        rows = [check(l, thumb) for l in open(a[0], encoding="utf-8").read().splitlines() if l.strip()]
    else:
        print(__doc__); sys.exit(1)
    rows.sort(key=lambda r: -r["score"])
    if as_json: print(json.dumps(rows, indent=1, ensure_ascii=False)); return
    for r in rows: show(r)
    print()

if __name__ == "__main__":
    main()
