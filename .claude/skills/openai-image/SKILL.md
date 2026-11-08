---
name: openai-image
description: OpenAI 이미지 API(gpt-image)로 이미지를 바로 만들거나 고친다. API 크레딧이 들기 때문에 사용자가 "API로 만들어", "직접 생성해"처럼 분명히 요청할 때만 쓴다. 그 밖의 이미지 요청은 chatgpt-image-prompt 스킬을 쓴다. 결과는 generated/images/ 에 저장된다.
---

# OpenAI 이미지

`scripts/image.py`로 OpenAI 이미지 API를 부른다. 클라우드 세션에서는 프록시가 api.openai.com 요청에 API 키를 넣어 주므로 키를 따로 다루지 않는다. 키를 묻거나 출력하지 않는다.

## 만들기

```bash
python3 .claude/skills/openai-image/scripts/image.py generate "프롬프트" --size 1536x1024 --quality high
```

## 고치기 (참고 이미지, 합성, 일부만 수정)

```bash
python3 .claude/skills/openai-image/scripts/image.py edit "바꿀 내용" --image 원본.png [--image 참고.png] [--mask 마스크.png]
```

마스크는 원본과 같은 크기의 PNG이고, 투명한 부분만 다시 그린다.

## 옵션

| 옵션 | 값 | 기본 |
|---|---|---|
| `--model` | `gpt-image-2`, `gpt-image-1.5`, `gpt-image-1-mini`(싸고 빠름), `chatgpt-image-latest` | `gpt-image-2` (환경 변수 `OPENAI_IMAGE_MODEL`로 바꿈) |
| `--size` | `1024x1024`, `1536x1024`(가로), `1024x1536`(세로), `auto` | `auto` |
| `--quality` | `low`, `medium`, `high`, `auto` | `auto` |
| `--n` | 장수 | 1 |
| `--background` | `transparent`(png·webp만), `opaque`, `auto` | `auto` |
| `--format` | `png`, `jpeg`, `webp` | `png` |
| `--name` | 파일 이름 앞부분 | 프롬프트에서 만듦 |
| `--out` | 저장 폴더 | `generated/images` |

## 작업 순서

1. 프롬프트는 영어로 구체적으로 쓴다. 주제, 구도, 조명, 스타일, 색, 화면비를 넣는다. 화면에 들어갈 글자는 따옴표로 정확히 적는다.
2. 웹 화면에 쓸 이미지는 DESIGN.md의 색과 분위기를 프롬프트에 반영한다.
3. 시안을 고를 때는 `--quality low --n 3`으로 먼저 보고, 고른 방향을 `--quality high`로 다시 만든다.
4. 스크립트가 출력한 파일 경로를 Read로 열어 결과를 직접 확인한다. 의도와 다르면 프롬프트를 고쳐 다시 만든다.
5. 쓰기로 한 이미지는 쓰는 곳(예: 페이지의 assets 폴더)으로 복사하고, 사용자에게 파일 경로를 알려 준다.

## 오류

- `429 ... no credits`: OpenAI API 크레딧이 없다. ChatGPT 구독과 API 요금은 따로다. 사용자에게 https://platform.openai.com/settings/organization/billing 에서 충전하도록 알리고 멈춘다.
- `403`, `request blocked`: 이 환경의 네트워크나 키 설정 문제다. 사용자에게 알린다.
- 정책 거절: 프롬프트를 바꾸되, 거절된 내용을 돌려서 만들지 않는다.
