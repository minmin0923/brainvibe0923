---
name: ig-profile
description: >-
  Score an Instagram profile out of 100 against a 12-part rubric and rewrite
  the parts that lose points - name field, bio, link, highlights, pinned three,
  grid. Use when the user says "optimize my profile", "fix my bio", "score my
  Instagram", "why don't people follow me", or pastes their profile and asks how
  it reads.
  Korean requests too: "프로필 점검", "소개글 고쳐줘", "바이오", "왜 팔로우를 안 해".
---

# ig-profile

Almost everybody optimises the wrong thing here. The profile is not a
storefront people browse. It is a **decision screen**, arrived at from one
reel, and it gets about three seconds to answer one question: is there more of
that here, and is it for me.

## Input

Ask the user to paste or screenshot: the name field, the handle, the bio, what
the link points to, the highlight names, what is pinned, and the first nine
grid covers. A screenshot of the top of the profile plus the first two grid
rows is enough for a first pass.

Do not log into Instagram on their behalf.

## Score it

Read `rubric.json` in this folder. Twelve items, 100 points, each with what
full marks looks like and how it usually fails. Score every item, show the
table, give the total. Be honest. Most profiles land in the 30s and 40s on the
first pass and a generous score is useless.

```
PROFILE SCORE  38/100

  name field       2/12   name only, no words anyone searches
  bio first line   3/12   three nouns and a coffee emoji
  pinned three     0/10   nothing pinned
  highlights       2/8    "Random", "Life", "2023"
  grid legibility  4/8    six of nine covers are a face mid-sentence
  ...
```

## Then rewrite, in this order

Fix in descending order of points lost. Do not rewrite everything at once, the
user has to actually go and change each of these.

**1. The name field (30 characters).** The bold line under the photo, not the
handle. This is the field Instagram search matches against, and most accounts
put a name in it and nothing else. Format that works:
`{Name} | {what you do, in searched words}`. Give three options.

**2. Bio line one.** Who this is for and what changes. Not a job title, not
adjectives, not a pipe-separated list of identities. The rest of the 150
characters carries one piece of proof or one plain offer.

**3. The pinned three.** Three slots, three different jobs: the best proof, the
clearest explanation of the offer, the best introduction to the person. This is
the highest-leverage fix on the whole profile and it takes four taps. An
unpinned grid shows whatever was posted last, which is a coin flip.

**4. Highlights.** Four to six, named for the questions a buyer asks: Pricing,
Results, How it works, About. Not "Random". Delete the rest.

**5. The link.** One destination that matches what the bio just promised. Five
are allowed; two is already a menu and a menu converts worse than a door.

**6. Grid covers.** The first nine at thumbnail size. Reel covers get chosen,
not left as whatever frame one was. Four words of text on a cover makes a grid
readable in one glance.

## Output

Score table, then the rewrites as copy-ready blocks in fix-first order, each
run through `/ig-human`. Re-score at the end and show the delta honestly. If
the rewrite reaches 84 and not 98, say 84, and say what the rest needs, which
is usually a grid, a story habit and a pinned post that does not exist yet.
None of that is a rewrite.

Nothing is saved to Instagram by this skill. The user edits each field.

## 한국어로 쓸 때

- 사용자가 한국어로 말하면 결과(설명, 표, 초안, 마지막 질문)를 모두 한국어로 쓴다. 마지막 확인 질문은 **"이대로 올릴까요, 고칠까요?"**로 쓴다.
- 함께 있는 스크립트는 한국어를 읽는다(`ig-reel/ko.py`: 조사 떼기, 음절로 길이 재기, 한국어 인사·군말·긴장 표현·호칭·행동 요청·의미 없는 해시태그 목록, '41.2만' 같은 숫자 읽기). 점수는 경험칙이라서 낮은 점수는 다시 볼 이유일 뿐이고, 높은 점수가 조회수를 보장하지 않는다고 함께 말한다.
- 목소리 파일(`~/.claude/instagram/voice.md`)에 존댓말/반말, 자주 쓰는 끝맺음("~거든요", "~입니다"), 쓰지 않는 말을 적고 그대로 따른다.
- 사람에게 보여 주기 전에 `ig-human`의 `detect.py`로 한 번 거른다. 한국어 AI 상투어("혁신적인", "다양한", "~에 대해 알아보겠습니다", "결론적으로")와 기계식 문장 구조("단순한 X가 아니라 Y", "첫째, 둘째", "그렇다면 어떻게 해야 할까요?")를 잡는다.

- `rubric.json`의 각 항목에 한국어 이름과 기준(`name_ko`, `full_marks_ko`, `common_fail_ko`)이 있다. 한국어 사용자에게는 이것으로 보여 준다.
- **인스타그램 검색 최적화**는 이 스킬에서 함께 한다: ① 이름 칸(30자)에 이름 + 검색어, ② 소개 첫 줄에 대상과 결과를 검색어로, ③ 카테고리를 제안과 맞게, ④ 고정 게시물 캡션 첫 줄에 핵심 검색어, ⑤ 게시물마다 대체 텍스트. 한국 사용자는 한글 검색어와 영어 검색어를 둘 다 칠 수 있으니 어느 쪽을 이름 칸에 둘지 사용자와 정한다.
