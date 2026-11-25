---
name: yt-package
description: >-
  Write and lint the title and thumbnail for a YouTube video as one pairing,
  checking truncation, duplication and vagueness before publish. Use for
  "title ideas", "what should I call this", "thumbnail text", "my CTR is
  bad", packaging, or any request to rename or repackage an existing video.
  Korean requests too: "제목 지어줘", "썸네일 문구", "클릭률이 낮아", "제목 점검".
---

# yt-package

The title and the thumbnail are ONE unit. Writing them separately is why most packaging fails: the
thumbnail repeats the title, and half the click surface says the same thing twice.

```bash
python3 title.py --title "..." --thumb "AI RAN IT"
python3 title.py titles.txt            # one per line, ranked
```

## Before you write

1. Read `~/.claude/youtube/voice.md` if it exists. That is the user's voice profile: how they talk
   on camera, the words they never use, who they are talking to, what they will not claim. If it
   does not exist, ask for **three of their own videos**, read or transcribe them, infer the voice,
   and write the file. A script in the wrong voice is worse than no script, because they have to
   read it out loud.
2. Never invent a number, a result or a source. If a figure would strengthen it and you do not have
   one, ask for it or write the line without it.

## Rules the tool enforces, and why

- **60 characters** is where desktop search truncates, **40** is a mobile home feed. Both are
  reported because they fail differently: a desktop cut loses the tail, a mobile cut can lose the
  subject.
- **The thumbnail must not repeat the title.** Different words, same promise.
- **Three words maximum on the thumbnail.** At feed size a fourth word is a grey smear.
- **A number, a name or a date** beats every adjective available to you.
- **Two all-caps words is the ceiling** before a title reads as spam.

## Write ten, keep two

Generate ten titles, run them all through `title.py`, show the user the top three with their scores
and the specific issue on each. For the winner, write the thumbnail brief: the expression, the
framing, the three words, and what the background has to do to hold contrast at feed size.

## The gate

Nothing here publishes. This skill writes and you publish. Every output ends in a block the user
copies, and the last line of every run is the question: **ship it, or change it?**

## 한국어로 쓸 때

- 사용자가 한국어로 말하면 모든 결과(설명, 표, 마지막 질문)를 한국어로 쓴다. 마지막 줄의 질문은 **"이대로 올릴까요, 고칠까요?"**로 쓴다.
- 함께 있는 스크립트는 한국어를 읽는다(`yt-script/ko.py`: 조사 떼기, 한국어 과장어·군말·호칭 목록, 한글 표시 폭). 점수는 경험칙이라서, 낮은 점수는 다시 볼 이유일 뿐이고 높은 점수가 성과를 보장하지 않는다고 함께 말한다.
- 목소리 파일(`~/.claude/youtube/voice.md`)에 존댓말/반말, 자주 쓰는 말투("~거든요", "~입니다")를 적고 그대로 따른다.

- 한글은 영문보다 넓어서 `title.py`는 한글 한 글자를 영문 1.7자 폭으로 계산한다(추정치). 한국어 제목은 대략 **데스크톱 35자, 모바일 23자** 안쪽에 주제가 있어야 한다.
- 한국어 과장어(최고, 끝판왕, 완벽, 역대급, 충격, 미친 ...)와 `!!!`, `ㅋㅋ`, `【】` 장식을 잡아낸다. 썸네일 문구는 한글 약 10자 안쪽.
