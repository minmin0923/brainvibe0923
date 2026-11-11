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

## Codex 검토는 하지 않는다

사용자 지시(2026-11-10): OpenAI 크레딧이 충전되어 있지 않으므로 Codex 검토를 하지 않는다. 사용자가 "코덱스 검토 다시 켜"라고 하기 전까지 유지한다.

- `scripts/codex-review.sh`와 `codex-loop` 스킬을 실행하지 않는다. Codex 플러그인도 꺼 두었다(`.claude/settings.json`).
- 대신 결과물을 내기 전에 Claude가 스스로 한 번 검토한다: 틀린 곳, 빠진 것, 더 구체화할 것, 더 나은 다른 방식이 있는지.
- 다시 켤 때: `.claude/settings.json`의 `codex@openai-codex`를 `true`로, 이 절을 `codex-loop` 스킬을 따르라는 내용으로 바꾸고, Codex CLI를 설치(`npm install -g @openai/codex`)한다.

## 에이전트 모드

예약 작업 "에이전트 실행"(`trig_01RcEtnYfiu8ahUAo3fcqxyw`)이 깨울 때마다 새 세션이 `agent/RUNBOOK.md`를 실행한다. 모델은 Sonnet, 깨어나는 시간은 켜진 반복 예약에 맞춘다. 사용법은 `agent/README.md`.

- 사용자가 "에이전트에게 시켜: ..."라고 하면 `agent/INBOX.md`의 "할 일"에 `- [ ]` 항목으로 추가하고 커밋한다.
- "지금 에이전트 실행해"는 예약 작업을 즉시 실행한다. "에이전트 멈춰"는 예약 작업을 끈다.
- 사용자가 지시하고 과정을 보는 화면은 관제실(`agent/console.html`, https://claude.ai/artifact/PhVkovV8DEeonV949DC6qF)이다. 고치면 같은 주소로 다시 게시한다.
- `/agent-panel`(`plugins/agent-panel`)은 창을 띄울 수 있는 화면에서만 보인다. 안 되는 화면에서는 글로 나온다.
- "에이전트 상태"를 물으면 `agent/LOG.md`, 열린 `[에이전트]` PR, 남은 명령을 요약한다.

## 문서, 발표, 대시보드 양식

보고서, 회의록, 기획서, 발표 자료, 대시보드를 만들 때는 먼저 `templates/README.md`의 "상황별로 고르기" 표에서 맞는 양식을 찾아 그 구조와 스타일에서 시작한다.

- 바로 쓰는 양식(`templates/slides`, `templates/documents`, `templates/dashboards`)은 DESIGN.md를 따른다. 파일을 복사해 내용만 바꾼다.
- `templates/vendor`는 GitHub에서 받은 원본이다. 구성과 항목만 참고하고, 색과 글꼴은 DESIGN.md로 바꿔서 쓴다.
- 새 양식을 만들면 `templates/index.html`과 `templates/README.md`에 추가한다.

## 환경

- 클라우드 세션에서는 `.claude/hooks/session-start.sh`가 `agent-browser`를 설치하고, 미리 설치된 Chromium 경로를 `AGENT_BROWSER_EXECUTABLE_PATH`로 잡아 준다.
- `.env`처럼 비밀키가 들어 있는 파일은 읽거나 출력하지 않는다.
