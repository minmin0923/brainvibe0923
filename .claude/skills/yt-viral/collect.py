#!/usr/bin/env python3
"""collect.py - 채널들의 최근 영상을 모아 swipe.py 입력 파일을 만든다. (yt-dlp 필요)

    python3 collect.py out.json URL1 URL2 ...           # 채널 주소(…/@이름 또는 …/channel/ID)
    python3 collect.py out.json --search "클로드 코드" --channels 10
    python3 collect.py out.json URL1 --per 30

왜 두 번 받는가: 한국어 설정(lang=ko)으로 받으면 원래 한국어 제목이 오지만, 조회수가
"6.8만회"처럼 한국어로 적혀 yt-dlp가 숫자로 못 읽는 영상이 많다. 기본 설정으로 받으면 조회수는
정확하지만 제목이 영어로 자동 번역돼 온다. 그래서 조회수는 기본 설정에서, 제목은 한국어 설정에서
가져와 영상 ID로 합친다.

공개 목록만 읽는다. 로그인, 쿠키, 계정 정보는 쓰지 않는다.
"""
import json, subprocess, sys

def flat(url, n, lang=None):
    cmd = ["yt-dlp", "--flat-playlist", "-J", "--playlist-end", str(n)]
    if lang: cmd += ["--extractor-args", f"youtube:lang={lang}"]
    r = subprocess.run(cmd + [url], capture_output=True, text=True, timeout=120)
    try:
        d = json.loads(r.stdout)
        return d.get("channel") or d.get("uploader"), d.get("entries", []) or []
    except Exception:
        return None, []

def videos_url(u):
    u = u.rstrip("/")
    return u if u.endswith(("/videos", "/shorts", "/streams")) else u + "/videos"

def main():
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(1)
    out_path = a[0]
    per = int(a[a.index("--per") + 1]) if "--per" in a else 20
    urls = []
    if "--search" in a:
        q = a[a.index("--search") + 1]
        k = int(a[a.index("--channels") + 1]) if "--channels" in a else 10
        seen = {}
        for e in flat(f"ytsearch{k * 4}:{q}", k * 4)[1]:
            if e.get("channel_url"): seen.setdefault(e["channel_url"], e.get("channel"))
        urls = list(seen)[:k]
    skip = {"--per", "--search", "--channels"}
    rest, i = [], 1
    while i < len(a):
        if a[i] in skip: i += 2; continue
        rest.append(a[i]); i += 1
    urls += rest
    rows = []
    for u in urls:
        cname, base = flat(videos_url(u), per)
        kname, kentries = flat(videos_url(u), per, "ko")
        ko = {e.get("id"): e.get("title") for e in kentries}
        name = kname or cname or u
        n = 0
        for e in base:
            if e.get("view_count") is None: continue
            rows.append({"channel": name,
                         "title": ko.get(e.get("id")) or e.get("title", ""),
                         "views": e["view_count"], "url": e.get("url", ""),
                         "duration": e.get("duration")})
            n += 1
        print(f"  {name}: 영상 {n}개", file=sys.stderr)
    json.dump(rows, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"  {len(rows)}개 저장: {out_path}", file=sys.stderr)

if __name__ == "__main__":
    main()
