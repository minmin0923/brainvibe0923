#!/usr/bin/env python3
"""의정부 관련 기사 후보를 언론사 누리집에서 모은다. AI 없이 도는 수집 단계.

쓰는 법: python3 scripts/news_collect.py 2026-11-11
만드는 것: reports/uijeongbu-news/<날짜>/candidates.json
  outlets:  언론사별 접속 결과 (status: "확인함" | "접속 실패" | "목록을 읽지 못함")
  articles: 제목에 찾는 말이 들어간 기사 (제목, 주소, 게재 시각, 본문 앞부분)
"""
import datetime, html, json, os, re, sys, urllib.parse, urllib.request

KEYWORDS = ["의정부"]
UA = "brainvibe-news-brief/1.0 (+https://github.com/minmin0923/brainvibe0923)"
OUTLETS = [
    # (이름, 누리집, 묶음, 의뢰자 분류)
    ("중부일보", "https://www.joongboo.com", "지역 밀착", "민주당에 우호적"),
    ("경기북부시민신문", "https://www.simin24.com", "지역 밀착", "보수 성향"),
    ("경기북부탑뉴스", "https://www.gbtopnews.net", "지역 밀착", "국민의힘에 우호적"),
    ("의정부신문", "https://www.ujbnews.net", "지역 밀착", "보수 성향"),
    ("한북신문", "https://www.hbnews.kr", "지역 밀착", "보수 성향"),
    ("경원일보", "https://www.k1ilbo.com", "지역 밀착", "보수 성향"),
    ("의양신문", "https://www.uynews.net", "지역 밀착", "보수 성향"),
    ("경기일보", "https://www.kyeonggi.com", "광역", "분류 미정"),
    ("경인일보", "https://www.kyeongin.com", "광역", "분류 미정"),
    ("경기신문", "https://www.kgnews.co.kr", "광역", "분류 미정"),
    ("기호일보", "https://www.kihoilbo.co.kr", "광역", "분류 미정"),
]
# 검색 주소 후보. {q}는 찾는 말. 앞에서부터 시도하고, 다 안 되면 첫 화면을 본다.
SEARCH_PATHS = [
    "/news/articleList.html?sc_area=A&view_type=sm&sc_word={q}",
    "/search?q={q}",
    "/?s={q}",
    "/",
]
MAX_PER_OUTLET = 8
BODY_CHARS = 1400


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ko"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        raw = res.read(2_000_000)
        ctype = res.headers.get("Content-Type", "")
    m = re.search(r"charset=([\w-]+)", ctype, re.I) or re.search(rb'charset=["\']?([\w-]+)', raw[:3000], re.I)
    enc = (m.group(1).decode() if m and isinstance(m.group(1), bytes) else (m.group(1) if m else "utf-8")).lower()
    for e in (enc, "utf-8", "cp949"):
        try:
            return raw.decode(e)
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("utf-8", "replace")


def text_of(fragment):
    fragment = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"(?s)<[^>]+>", " ", fragment))).strip()


def find_links(page, base):
    seen, out = set(), []
    for href, inner in re.findall(r'(?is)<a\b[^>]*?href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', page):
        title = text_of(inner)
        if len(title) < 8 or not any(k in title for k in KEYWORDS):
            continue
        url = urllib.parse.urljoin(base, html.unescape(href))
        if urllib.parse.urlparse(url).netloc.replace("www.", "") != urllib.parse.urlparse(base).netloc.replace("www.", ""):
            continue
        if not re.search(r"idxno=\d+|/\d{4,}|article|view|news", url, re.I):
            continue
        key = re.sub(r"[?&](page|sc_\w+|view_type)=[^&]*", "", url)
        if key in seen:
            continue
        seen.add(key)
        out.append((title[:200], url))
    return out


def article_detail(url):
    page = fetch(url)
    def meta(name):
        m = re.search(r'(?is)<meta[^>]+(?:property|name)=["\']%s["\'][^>]+content=["\']([^"\']*)' % re.escape(name), page)
        return html.unescape(m.group(1)).strip() if m else ""
    published = meta("article:published_time") or meta("og:article:published_time")
    if not published:
        m = re.search(r"(20\d{2})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})\.?\s+(\d{1,2}):(\d{2})", text_of(page[:60000]))
        if m:
            published = "%s-%02d-%02dT%02d:%s:00+09:00" % (m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), m.group(5))
    body = ""
    m = re.search(r'(?is)<(?:div|article)[^>]+(?:id|class|itemprop)=["\'][^"\']*(?:article-view-content|articleBody|article_txt|news_body|view_con|article-body)[^"\']*["\'][^>]*>(.*)', page)
    if m:
        body = text_of(m.group(1))[:BODY_CHARS]
    if len(body) < 120:
        body = meta("og:description") or meta("description")
    paywalled = bool(re.search(r"로그인 후|유료 ?회원|구독 후", page[:200000])) and len(body) < 200
    return published, body[:BODY_CHARS], paywalled


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else ""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        sys.exit("날짜를 YYYY-MM-DD로 적어 주세요.")
    kst = datetime.timezone(datetime.timedelta(hours=9))
    now = datetime.datetime.now(kst)
    since = now - datetime.timedelta(hours=36)
    outlets, articles = [], []
    for name, site, group, label in OUTLETS:
        info = {"name": name, "site": site, "group": group, "client_label": label, "status": "목록을 읽지 못함", "method": "", "error": "", "article_count": 0}
        links, errors = [], []
        for path in SEARCH_PATHS:
            url = site + path.format(q=urllib.parse.quote(KEYWORDS[0]))
            try:
                links = find_links(fetch(url), site)
            except Exception as e:  # 접속 거부, 시간 초과 등
                errors.append("%s: %s" % (path.split("?")[0], str(e)[:80]))
                continue
            if links:
                info["method"] = "검색" if path != "/" else "첫 화면"
                break
        if not links:
            info["status"] = "접속 실패" if errors and len(errors) == len(SEARCH_PATHS) else "목록을 읽지 못함"
            info["error"] = "; ".join(errors)[:300]
            outlets.append(info)
            continue
        info["status"] = "확인함"
        for title, url in links[:MAX_PER_OUTLET]:
            item = {"outlet": name, "title": title, "url": url, "published_at": "", "body": "", "paywalled": False, "note": ""}
            try:
                item["published_at"], item["body"], item["paywalled"] = article_detail(url)
            except Exception as e:
                item["note"] = "본문을 읽지 못함: %s" % str(e)[:80]
            if item["published_at"]:
                try:
                    when = datetime.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
                    if when.tzinfo is None:
                        when = when.replace(tzinfo=kst)
                    if when < since:
                        continue  # 36시간보다 오래된 기사
                except ValueError:
                    item["note"] = (item["note"] + " 게재 시각 형식을 읽지 못함").strip()
            else:
                item["note"] = (item["note"] + " 게재 시각 미확인").strip()
            articles.append(item)
            info["article_count"] += 1
        outlets.append(info)
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reports", "uijeongbu-news", date)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "candidates.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"collected_at": now.isoformat(timespec="seconds"), "window": "최근 36시간", "keywords": KEYWORDS, "outlets": outlets, "articles": articles}, f, ensure_ascii=False, indent=1)
    print("후보 %d건 → %s" % (len(articles), os.path.relpath(path)))
    for o in outlets:
        print(" - %s: %s (%d건) %s" % (o["name"], o["status"], o["article_count"], o["error"][:100]))


if __name__ == "__main__":
    main()
