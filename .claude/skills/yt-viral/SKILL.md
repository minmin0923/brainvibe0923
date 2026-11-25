---
name: yt-viral
description: >-
  Find what is actually working in the user's niche on YouTube and rank it
  by how far each video beat its own channel, then name the formula. Use for
  "what's working right now", "find viral videos in my niche", "why did this
  blow up", competitor research, or a swipe file.
  Korean requests too: "요즘 뭐가 잘 돼", "내 분야에서 터진 영상", "경쟁 채널 분석", "급상승 영상".
---

# yt-viral

Raw view counts rank channel size, not ideas. This ranks by **multiple over each channel's own
median**, which is the only version of the question that is about the video.

```bash
python3 swipe.py collected.json --min 2.0
```

## Collecting the input

You need at least **four videos per channel** or a median means nothing, and the tool will skip the
channel and tell you it did. Collect them however the user prefers - `yt-dlp --flat-playlist -J`
against a channel URL is the fastest, the public page works, a manual list works.

```json
[{"channel":"...","title":"...","views":412000,"url":"...","duration":613}]
```

**Read, do not scrape.** Public listings only, never a logged-in session, never the user's own
account credentials.

## Reading the output

The multiple is the signal. The formula line is a judgement about the TITLE, matched against
[the 21 formulas](../yt-script/hooks.json) - it is not a claim about why the video worked, and you
should say so when you present it.

What to hand back: the top five with their multiples, the formula each used, and the ONE structural
thing they share. Then the harder line - which of those the user could actually make this week, in
their voice, with what they have.

## The gate

Nothing here publishes. This skill writes and you publish. Every output ends in a block the user
copies, and the last line of every run is the question: **ship it, or change it?**

## 한국어로 쓸 때

- 사용자가 한국어로 말하면 모든 결과(설명, 표, 마지막 질문)를 한국어로 쓴다. 마지막 줄의 질문은 **"이대로 올릴까요, 고칠까요?"**로 쓴다.
- 함께 있는 스크립트는 한국어를 읽는다(`yt-script/ko.py`: 조사 떼기, 한국어 과장어·군말·호칭 목록, 한글 표시 폭). 점수는 경험칙이라서, 낮은 점수는 다시 볼 이유일 뿐이고 높은 점수가 성과를 보장하지 않는다고 함께 말한다.
- 목소리 파일(`~/.claude/youtube/voice.md`)에 존댓말/반말, 자주 쓰는 말투("~거든요", "~입니다")를 적고 그대로 따른다.

- 한국어 채널은 `collect.py`로 모은다. 조회수는 기본 설정에서, 원래 한국어 제목은 `lang=ko` 설정에서 받아 합친다(한국어 설정만 쓰면 "6.8만회"를 숫자로 못 읽어 영상이 빠지고, 기본 설정만 쓰면 제목이 영어로 번역돼 온다).

```bash
python3 collect.py collected.json --search "클로드 코드" --channels 10   # 검색으로 채널 찾기
python3 collect.py collected.json https://www.youtube.com/@채널이름 --per 30
python3 swipe.py collected.json --min 2.0
```
- 제목 공식은 21개 + 한국어판에서 더한 **올인원형**(풀버전, 풀코스, 완전 정복, "이 영상 하나만 보면")까지 22개다. 한국 AI·코딩 채널 표본(2026년 11월)에서 4배 이상 급상승 영상의 가장 흔한 형식 중 하나였다(분석·해부형과 함께 3개씩).
