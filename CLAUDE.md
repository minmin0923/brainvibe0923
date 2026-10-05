# CLAUDE.md

## 화면(UI) 작업 순서

화면을 새로 만들거나 고칠 때는 사용자가 따로 말하지 않아도 아래 순서를 따른다.

1. **기준 읽기:** 작업 전에 `DESIGN.md`를 읽는다. 색, 글꼴, 여백은 여기 정의된 값만 쓴다. 기준을 바꿔야 하면 먼저 사용자에게 묻고 `DESIGN.md`를 고친다.
2. **만들기:**
   - 참고 이미지나 시안이 있으면 `image-to-code` 스킬로 구현한다.
   - 랜딩 페이지, 포트폴리오, 리디자인은 `design-taste-frontend` 스킬을 따른다. 스킬의 기본 다이얼 대신 `DESIGN.md`의 다이얼 값을 쓴다.
   - 스킬 규칙과 `DESIGN.md`가 다르면 `DESIGN.md`가 우선이다.
3. **눈으로 확인:** `agent-browser` 스킬로 만든 화면을 직접 열어 본다. 360px, 768px, 1280px 폭과 라이트/다크 모드를 스크린샷으로 확인하고, 버튼과 링크를 눌러 본다.
   - 먼저 `agent-browser skills get core`로 사용법을 불러온다.
   - 로컬 파일은 `file://` 경로로, 개발 서버가 있으면 그 주소로 연다.
4. **점검:** `web-design-guidelines` 스킬로 바뀐 파일을 점검하고, 나온 문제를 고친 뒤 3단계를 다시 한다.
5. **완료 보고:** `DESIGN.md` 10장의 점검표를 채워서 보고한다. 확인하지 못한 항목은 그렇다고 적는다.

## 환경

- 클라우드 세션에서는 `.claude/hooks/session-start.sh`가 `agent-browser`를 설치하고, 미리 설치된 Chromium 경로를 `AGENT_BROWSER_EXECUTABLE_PATH`로 잡아 준다.
- `.env`처럼 비밀키가 들어 있는 파일은 읽거나 출력하지 않는다.

## 스킬 안내판

- 스킬 설명과 찾을 단어는 `.claude/skill-catalog.json` 한 곳에 둔다. 스킬을 추가하거나 바꾸면 여기를 고치고 `node skill-board/build.mjs`로 안내판 페이지를 다시 만든다.
- 명령을 보낼 때마다 `UserPromptSubmit` 훅(`.claude/hooks/skill-match.mjs`)이 `스킬 체크:` 줄을, 스킬이 실제로 불리면 `PostToolUse` 훅이 `스킬 사용됨:` 줄을 띄운다. 이 후보는 단어로 고른 것이므로, 실제로 맞을 때만 스킬을 쓴다.
- Claude Code 터미널/데스크톱에서 쓰는 패널 모드는 `.claude/skills/skill-panel/`에 있고, 프로젝트를 열면 저절로 불러온다. 판별 규칙은 `hooks/match.ts`와 `.claude/hooks/` 쪽 `.mjs` 파일 두 곳에 있으니 같이 고친다.
- 자동 열기 설정은 `.claude/skill-board.json`(`autoOpen`, 안내판 주소 `url`)에 있다. 켜져 있으면 `SessionStart` 훅이 알려 주므로, 세션의 첫 답에서 Artifact `open`으로 안내판을 연다.
- "안내판 열어/닫아", "안내판 자동 열기 꺼/켜"는 훅이 알아듣는다. 자동 열기 설정이 바뀌면 `.claude/skill-board.json`을 커밋하고 푸시해서 다음 세션에도 남게 한다.
