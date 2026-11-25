---
name: yt-script
description: >-
  Write a YouTube video script from a raw idea - hook options off 21
  formulas, scored, then the full spoken script with the retention beats
  marked. Use whenever the user wants a video script, a hook, an opening
  line, "what should I say", "write my next video", or is about to record
  and does not have the first fifteen seconds yet.
  Korean requests too: "대본 써줘", "첫 마디", "훅", "오프닝".
---

# yt-script

One idea into a script somebody finishes.

Two tools live in this folder and both actually run. Use them. Do not eyeball the hook.

```bash
python3 hookscore.py hooks.txt              # rank your hook options
python3 hookscore.py --hook "one line"      # score a single one
```

## Before you write

1. Read `~/.claude/youtube/voice.md` if it exists. That is the user's voice profile: how they talk
   on camera, the words they never use, who they are talking to, what they will not claim. If it
   does not exist, ask for **three of their own videos**, read or transcribe them, infer the voice,
   and write the file. A script in the wrong voice is worse than no script, because they have to
   read it out loud.
2. Never invent a number, a result or a source. If a figure would strengthen it and you do not have
   one, ask for it or write the line without it.

## The shape

**The first 15 seconds is the whole job.** It does three things or the video leaks: confirm the
click the title promised, open a question the viewer cannot close, and prove the payoff exists.

1. **Hook.** Write FIVE against [the 21 formulas](hooks.json), run them through `hookscore.py`,
   keep the top two, and show the user both with their scores. Never hand over one hook.
2. **The turn** (0:15-0:45). Say what the video is going to do, in one sentence, and start doing it.
   No channel intro, no "before we get started", no subscribe pitch. Those are the single most
   common cause of the 0:30 cliff.
3. **The body.** One idea per beat. Mark each beat with what is ON SCREEN, not just what is said -
   a talking head with nothing to look at is a podcast.
4. **The payoff.** Deliver the thing the hook promised, explicitly, and say that you are delivering
   it: "that is the prompt, it is in the description".
5. **The close.** One ask. Not three.

## What to hand back

- the two best hooks with their scored panels
- the script, beat by beat, with `[ON SCREEN: ...]` on every beat
- the runtime estimate at 150 words per minute
- one line naming which formula the winning hook used and why it fits this idea

## The gate

Nothing here publishes. This skill writes and you publish. Every output ends in a block the user
copies, and the last line of every run is the question: **ship it, or change it?**

## 한국어로 쓸 때

- 사용자가 한국어로 말하면 모든 결과(설명, 표, 마지막 질문)를 한국어로 쓴다. 마지막 줄의 질문은 **"이대로 올릴까요, 고칠까요?"**로 쓴다.
- 함께 있는 스크립트는 한국어를 읽는다(`yt-script/ko.py`: 조사 떼기, 한국어 과장어·군말·호칭 목록, 한글 표시 폭). 점수는 경험칙이라서, 낮은 점수는 다시 볼 이유일 뿐이고 높은 점수가 성과를 보장하지 않는다고 함께 말한다.
- 목소리 파일(`~/.claude/youtube/voice.md`)에 존댓말/반말, 자주 쓰는 말투("~거든요", "~입니다")를 적고 그대로 따른다.

- `hookscore.py`는 한국어 훅을 글자 수로 잰다. 10초 안에 말하는 훅은 대략 **18~60글자**다.
- `hooks.json`의 각 공식에는 한국어 이름(`name_ko`)과 한국어 패턴(`match_ko`)이 있다. 사용자에게는 한국어 이름으로 말한다.
