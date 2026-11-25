---
name: yt-chapters
description: >-
  Write YouTube chapters from a transcript, validated against YouTube's own
  rules so they actually render. Use for "add chapters", "timestamps",
  "break this video into sections".
  Korean requests too: "챕터 만들어줘", "타임스탬프".
---

# yt-chapters

```bash
python3 chapters.py transcript.srt --target 8
```

## The rules, which are not optional

A chapter list that breaks any of these silently does not become chapters at all - the block just
sits in the description doing nothing:

- The first entry must be **00:00**.
- There must be **at least three**.
- Each must be **at least 10 seconds** long.

The tool checks all three and tells you when a list is invalid rather than letting you paste it.

## Retitle every line

`chapters.py` finds the BOUNDARIES well - it scores the pauses you actually took by how much the
vocabulary shifts across them. The titles it emits are the topic words, and they are a draft. A
chapter called "Thumbnails Titles Packaging" is a placeholder. Rewrite each one as the promise of
that section, in the user's voice, three to five words.

Chapters are also a retention diagnostic: if a section cannot be named in five words, it is two
sections or it is filler.

## The gate

Nothing here publishes. This skill writes and you publish. Every output ends in a block the user
copies, and the last line of every run is the question: **ship it, or change it?**

## 한국어로 쓸 때

- 사용자가 한국어로 말하면 모든 결과(설명, 표, 마지막 질문)를 한국어로 쓴다. 마지막 줄의 질문은 **"이대로 올릴까요, 고칠까요?"**로 쓴다.
- 함께 있는 스크립트는 한국어를 읽는다(`yt-script/ko.py`: 조사 떼기, 한국어 과장어·군말·호칭 목록, 한글 표시 폭). 점수는 경험칙이라서, 낮은 점수는 다시 볼 이유일 뿐이고 높은 점수가 성과를 보장하지 않는다고 함께 말한다.
- 목소리 파일(`~/.claude/youtube/voice.md`)에 존댓말/반말, 자주 쓰는 말투("~거든요", "~입니다")를 적고 그대로 따른다.

- `chapters.py`는 한국어 자막에서 조사를 떼고 주제어를 뽑는다. 뽑힌 말은 초안이니 반드시 사람이 읽는 제목으로 고쳐 쓴다("설치 명령어 끝납니다" → "설치하기").
