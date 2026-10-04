# ChatGPT 연동 가이드

Claude와 ChatGPT를 같이 써서 주간 리포트의 정확도를 높이고, 이미지 시안까지 만드는 방법입니다.

## 1. 역할 나누기

| 단계 | 누가 | 하는 일 | 결과 파일 |
|---|---|---|---|
| 수집 | Apify (선택) | 해시태그 릴스의 실제 조회수를 가져온다 | `reports/<주차>.instagram.json` |
| 정리, 1차 확인 | Claude | 사례를 고르고 분석하고, 출처를 다시 검색해 확인한다 | `reports/<주차>.json` |
| 교차 검증 | ChatGPT | 웹 검색으로 같은 주장을 따로 확인하고, 결과를 높일 방법을 제안한다 | `reports/<주차>.gpt-review.json` |
| 이미지 | ChatGPT 이미지 모델 | 사례마다 우리 채널 버전 3컷 스토리보드 시안을 그린다 | `images/<주차>/*.png` |
| 합치기 | `tools/build.py` | 위 파일을 합쳐 화면용 `data.js`를 만든다 | `data.js` |

화면에서 두 쪽 모두 "확인"이면 **교차 확인**, 한쪽이라도 "반박"이면 **반박 있음**으로 표시됩니다.
한 모델이 틀려도 다른 모델이 잡을 수 있게 하는 구조입니다.

## 2. 필요한 서비스

| 서비스 | 필수 여부 | 용도 | 준비할 것 | 비용 (대략) |
|---|---|---|---|---|
| OpenAI API | 자동 연동에 필요 | 교차 검증, 이미지 생성 | platform.openai.com 가입, 결제 수단 등록, API 키 발급 | 이미지 1장 약 $0.05 (중간 품질). 주 10장이면 약 $0.5. 검증은 모델과 웹 검색 사용량에 따라 다름 |
| ChatGPT 앱 (Plus 등) | API 대신 쓸 수 있음 | 사람이 프롬프트를 붙여 넣어 검증, 이미지 생성 | 기존 구독 | 구독료만 |
| Apify | 선택 | 인스타그램 해시태그 릴스 실측 수집 | apify.com 가입, API 토큰 | 결과 1,000개당 약 $2 안팎 (액터마다 다름) |
| Instagram Graph API | 선택, 대안 | 공식 해시태그 검색 | 비즈니스나 크리에이터 계정, Meta 앱 등록 | 무료. 다만 7일에 해시태그 30개까지만 조회 가능 |

주의할 점:
- **ChatGPT Plus 구독과 OpenAI API는 결제가 따로입니다.** 구독이 있어도 API를 쓰려면 platform.openai.com에서 결제 수단을 따로 등록해야 합니다.
- 가격은 자주 바뀝니다. 실행 전에 OpenAI와 Apify의 가격 페이지를 확인하세요. `gpt_images.py`는 실행할 때 예상 비용을 먼저 보여 줍니다.
- 남의 게시물을 수집하는 것은 인스타그램 이용 약관과 충돌할 수 있습니다. 수집한 데이터는 트렌드 분석용으로만 쓰고, 영상이나 사진을 그대로 다시 올리지 않습니다.

## 3. 설정

### 방법 A. 내 컴퓨터에서 실행 (가장 쉬움)

1. 이 저장소를 내려받습니다.
2. 저장소 맨 위에 `.env` 파일을 만들고 키를 넣습니다. 이 파일은 `.gitignore`에 들어 있어 GitHub에 올라가지 않습니다.
   ```
   OPENAI_API_KEY=sk-...
   APIFY_TOKEN=apify_api_...     # 선택
   ```
3. 파이썬 3.9 이상만 있으면 됩니다. 추가로 설치할 패키지는 없습니다.

### 방법 B. Claude Code 클라우드 세션에서 실행

지금 클라우드 환경은 네트워크 정책 때문에 `api.openai.com`, `api.apify.com`, `www.instagram.com` 접속이 막혀 있습니다. 아래 두 가지를 바꾸면 Claude가 세션 안에서 직접 실행할 수 있습니다.

1. **네트워크 허용:** 세션 제목 줄의 클라우드 환경 메뉴에서 Edit을 누르고, Network access를 Custom으로 바꿉니다. Allowed domains에 `api.openai.com`, `api.apify.com`을 추가합니다. 기본 패키지 매니저 목록은 그대로 둡니다. 자세한 내용: https://code.claude.com/docs/en/cloud-environments#network-access
2. **키 넣기:** 같은 설정 화면의 환경 변수(또는 API credentials)에 `OPENAI_API_KEY`, 필요하면 `APIFY_TOKEN`을 추가합니다.
3. 새 세션을 열면 적용됩니다. **키를 채팅창에 붙여 넣지 마세요.**

### 모델 바꾸기 (선택)

기본값은 검증 `gpt-5`, 이미지 `gpt-image-2`입니다. 더 새 모델을 쓰려면 `.env`나 환경 변수에 적습니다.
```
OPENAI_TEXT_MODEL=모델이름
OPENAI_IMAGE_MODEL=모델이름
```
사용할 수 있는 모델 이름은 OpenAI 대시보드의 Models 페이지에서 확인합니다.

## 4. 매주 실행 순서

`trend-report` 폴더에서 실행합니다.

```bash
# 0) (선택) 인스타그램 실측 후보 수집
python3 tools/collect_instagram.py

# 1) Claude: reports/<주차>.json 작성 (새 주차는 지난 파일을 복사해서 시작)
#    Claude Code에게 "이번 주 리포트 만들어 줘"라고 하면 이 파일을 채웁니다.

# 2) ChatGPT 교차 검증
python3 tools/gpt_verify.py --dry-run     # 보낼 프롬프트 미리 보기
python3 tools/gpt_verify.py               # 실제 실행

# 3) ChatGPT 이미지 시안
python3 tools/gpt_images.py --dry-run     # 프롬프트와 예상 비용 확인
python3 tools/gpt_images.py

# 4) 화면 갱신
python3 tools/build.py
# index.html을 브라우저로 열어 확인
```

### API 없이 ChatGPT 앱으로 하기

1. 화면에서 사례를 펼치고 **ChatGPT 검증 프롬프트 복사**를 누릅니다.
2. ChatGPT 앱에서 웹 검색을 켜고 붙여 넣습니다.
3. 받은 JSON 답을 파일(예: `answer.json`)로 저장하고 아래 명령으로 넣습니다.
   ```bash
   python3 tools/gpt_verify.py --import jean-phil answer.json
   python3 tools/build.py
   ```
4. 이미지는 `python3 tools/gpt_images.py --dry-run`으로 프롬프트를 출력해 ChatGPT 앱에 붙여 넣고, 받은 이미지를 `images/<주차>/<사례id>.png`로 저장합니다. 그 다음 `images/<주차>/manifest.json`에 같은 모양으로 한 줄을 추가하고 `build.py`를 실행합니다.

## 5. 결과를 더 좋게 만드는 방법

**데이터 정확도**
- **실제 수치부터 확보:** 웹 기사에 나온 숫자는 늦고 반올림돼 있습니다. Apify로 릴스 조회수를 직접 받으면 "이번 주 정점" 판정이 숫자로 됩니다. 효과가 가장 큰 단계입니다.
- **두 모델 모두 확인한 것만 '교차 확인':** 한 모델만 확인한 내용은 기획에 쓰되 숫자는 인용하지 않습니다.
- **출처 2곳 원칙:** 출처가 1곳뿐이면 "일부 확인"으로 둡니다. 이번 주에는 AI tipping scene이 이 원칙으로 "확인 필요"가 됐습니다.
- **같은 시점에 비교:** 팔로워처럼 계속 바뀌는 숫자는 날짜를 같이 적습니다. 장 필의 팔로워는 3일째 14만 5천, 2주째 23만으로 시점마다 다릅니다.

**국내 사례 보강**
- 국내 AI 바이럴은 기사화가 늦습니다. `collect_instagram.py`의 해시태그에 국내 태그(`AI영상`, `AI릴스`, `챗GPT프롬프트`)를 유지하고, 상위 후보를 사람이 보고 사례로 옮깁니다.
- 국내 트렌드 레터(Trend A Word, 고구마팜)는 화요일, 목요일에 나옵니다. 리포트는 그 다음 날 만드는 것이 좋습니다.

**채널 성과로 연결**
- 각 사례의 "우리 채널에서 만든다면"을 실제로 만들었다면, 다음 주 리포트에 우리 영상의 조회수, 저장, 공유를 적습니다. 4주 정도 쌓이면 어떤 패턴이 우리 채널에 맞는지 숫자로 보입니다.
- 인스타그램 Edits 앱의 AI 어시스턴트(미국 먼저 제공)는 내 계정 데이터로 다음 영상을 제안합니다. 쓸 수 있게 되면 이 리포트와 같이 참고합니다.

**이미지 시안 품질**
- 프롬프트는 `prompts/image-item.md`에 있습니다. 채널 고정 캐릭터가 정해지면 그 외모 설명을 이 파일에 추가해 매주 같은 캐릭터가 나오게 합니다.
- 실존 인물, 연예인, 저작권 캐릭터는 넣지 않습니다. 프롬프트에 이미 금지 규칙이 들어 있습니다.
- 처음에는 `--quality low`로 여러 장 보고, 고른 것만 `medium`이나 `high`로 다시 만듭니다.

**자동화**
- 위 순서가 안정되면 매주 월요일 아침에 Claude Code 루틴으로 1~4단계를 돌리고, 사람은 검토만 하게 만들 수 있습니다. 네트워크와 키 설정(3장 방법 B)이 먼저 필요합니다.
