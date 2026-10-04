"""주간 리포트 도구들이 같이 쓰는 함수.

외부 패키지 없이 파이썬 표준 라이브러리만 쓴다.
API 키는 환경 변수에서 읽고, 없으면 저장소 루트의 .env 파일에서 읽는다.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # trend-report/
REPORTS = ROOT / "reports"
IMAGES = ROOT / "images"
PROMPTS = ROOT / "prompts"
REPO_ROOT = ROOT.parent

VERDICTS = ("confirmed", "partial", "unconfirmed", "contradicted")


def env(name, default=None, required=False):
    """환경 변수를 읽는다. 없으면 .env 파일을 찾아본다."""
    value = os.environ.get(name)
    if not value:
        for path in (REPO_ROOT / ".env", ROOT / ".env"):
            if path.exists():
                for line in path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, val = line.partition("=")
                        if key.strip() == name:
                            value = val.strip().strip('"').strip("'")
                            break
            if value:
                break
    if not value:
        value = default
    if required and not value:
        sys.exit(f"{name}가 없습니다. 환경 변수나 .env 파일에 넣어 주세요. 자세한 방법은 trend-report/GUIDE.md를 보세요.")
    return value


def today():
    return date.today().isoformat()


def report_ids():
    """reports/ 안의 주차 ID를 최신순으로 돌려준다."""
    ids = [p.stem for p in REPORTS.glob("*.json") if p.stem.count(".") == 0]
    return sorted(ids, reverse=True)


def load_report(week=None):
    week = week or report_ids()[0]
    path = REPORTS / f"{week}.json"
    if not path.exists():
        sys.exit(f"{path}가 없습니다.")
    return json.loads(path.read_text(encoding="utf-8"))


def load_json(path, default):
    path = Path(path)
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fill_template(name, values):
    """prompts/ 안의 템플릿에서 {{키}}를 값으로 바꾼다."""
    text = (PROMPTS / name).read_text(encoding="utf-8")
    for key, val in values.items():
        text = text.replace("{{" + key + "}}", val)
    return text


def item_brief(item):
    """검증과 이미지 프롬프트에 넣을 사례 요약 (JSON 문자열)."""
    keep = ["id", "title", "short", "account", "type", "firstSeen", "peak", "what", "metrics", "why", "caution", "idea", "sources"]
    return json.dumps({k: item.get(k) for k in keep}, ensure_ascii=False, indent=2)


def post_json(url, payload, headers, timeout=300, retries=3):
    """JSON을 보내고 JSON을 받는다. 일시적인 오류(429, 5xx)는 다시 시도한다."""
    body = json.dumps(payload).encode("utf-8")
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/json", **headers})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")[:500]
            if err.code in (429, 500, 502, 503, 504) and attempt < retries:
                wait = 2 ** (attempt + 1)
                print(f"  {err.code} 응답, {wait}초 뒤 다시 시도합니다.", file=sys.stderr)
                time.sleep(wait)
                continue
            raise SystemExit(f"API 오류 {err.code}: {detail}")
        except urllib.error.URLError as err:
            if attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            raise SystemExit(f"접속 실패: {err.reason}. 네트워크에서 이 주소를 허용했는지 확인하세요: {url}")


def openai_post(path, payload):
    key = env("OPENAI_API_KEY", required=True)
    base = env("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    return post_json(f"{base}{path}", payload, {"Authorization": f"Bearer {key}"})


def response_text(resp):
    """Responses API 응답에서 최종 텍스트를 꺼낸다."""
    if resp.get("output_text"):
        return resp["output_text"]
    parts = []
    for out in resp.get("output", []):
        if out.get("type") == "message":
            for c in out.get("content", []):
                if c.get("type") == "output_text":
                    parts.append(c.get("text", ""))
    return "".join(parts)


def response_citations(resp):
    """웹 검색 결과로 붙은 출처 URL을 모은다."""
    urls = []
    for out in resp.get("output", []):
        for c in out.get("content", []) or []:
            for ann in c.get("annotations", []) or []:
                if ann.get("type") == "url_citation" and ann.get("url") not in urls:
                    urls.append(ann.get("url"))
    return urls
