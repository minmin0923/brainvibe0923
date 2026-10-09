# 사용법: python3 instagram/tools/gen_mascot.py instagram/uijeongbu-benefit-map/chatgpt-mascot-prompts.md instagram/uijeongbu-benefit-map/assets
# OpenAI 키는 환경의 네트워크 시크릿(api.openai.com, Bearer)으로 자동 첨부된다.
import base64, json, re, sys, urllib.request, concurrent.futures as cf
md, outdir = sys.argv[1], sys.argv[2]
blocks = re.findall(r"^## (\d)\. (.+?)\n```\n(.*?)```", open(md, encoding="utf-8").read(), re.S | re.M)
jobs = [(n, t, p) for n, t, p in blocks if n in "12345"]
def run(job):
    n, title, prompt = job
    body = json.dumps({"model": "gpt-image-2.5-sunburst", "prompt": prompt.strip(),
                       "size": "1536x1024", "quality": "medium", "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", body,
                                 {"Content-Type": "application/json"})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        return f"{n} FAIL {e.code} {e.read()[:300]!r}"
    open(f"{outdir}/pini-gpt-{n}.png", "wb").write(base64.b64decode(d["data"][0]["b64_json"]))
    return f"{n} ok {title} usage={d.get('usage')}"
with cf.ThreadPoolExecutor(5) as ex:
    for r in ex.map(run, jobs): print(r, flush=True)
