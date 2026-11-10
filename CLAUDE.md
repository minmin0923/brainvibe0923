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

## 작업 기본 흐름: Claude 초안 → Codex 검토 → Claude 완성

결과물이 남는 작업(코드, 문서, 기획, 디자인, 분석)은 사용자가 따로 말하지 않아도 `codex-loop` 스킬 순서를 따른다.

1. Claude가 초안을 만든다.
2. `scripts/codex-review.sh`로 Codex에게 정정할 부분, 빠진 부분, 구체화할 부분, 다른 방식을 검토받는다.
3. Codex 의견을 직접 확인해 맞는 것만 반영하고 종합해서 완성한다. 최대 2라운드.
4. 보고할 때 Codex 검토로 바뀐 점과 반영하지 않은 의견을 함께 적는다.

- 단순 질문, 한 줄 수정, 사용자가 "코덱스 없이"라고 한 경우는 건너뛴다.
- 화면 작업은 위 "화면(UI) 작업 순서"의 2단계(만들기) 뒤에 Codex 검토를 넣는다.
- Codex가 실패하면 멈추지 말고 Claude가 같은 관점으로 자체 검토하고, 실패 사실과 이유를 보고한다.

## 에이전트 모드

예약 작업이 정해진 시간마다 새 세션을 열어 `agent/RUNBOOK.md`를 실행한다. 사용법은 `agent/README.md`.

- 사용자가 "에이전트에게 시켜: ..."라고 하면 `agent/INBOX.md`의 "할 일"에 `- [ ]` 항목으로 추가하고 커밋한다.
- "지금 에이전트 실행해"는 예약 작업을 즉시 실행한다. "에이전트 멈춰"는 예약 작업을 끈다.
- "에이전트 상태"를 물으면 `agent/LOG.md`, 열린 `[에이전트]` PR, 남은 명령을 요약한다.

## 문서, 발표, 대시보드 양식

보고서, 회의록, 기획서, 발표 자료, 대시보드를 만들 때는 먼저 `templates/README.md`의 "상황별로 고르기" 표에서 맞는 양식을 찾아 그 구조와 스타일에서 시작한다.

- 바로 쓰는 양식(`templates/slides`, `templates/documents`, `templates/dashboards`)은 DESIGN.md를 따른다. 파일을 복사해 내용만 바꾼다.
- `templates/vendor`는 GitHub에서 받은 원본이다. 구성과 항목만 참고하고, 색과 글꼴은 DESIGN.md로 바꿔서 쓴다.
- 새 양식을 만들면 `templates/index.html`과 `templates/README.md`에 추가한다.

## 환경

- 클라우드 세션에서는 `.claude/hooks/session-start.sh`가 `agent-browser`를 설치하고, 미리 설치된 Chromium 경로를 `AGENT_BROWSER_EXECUTABLE_PATH`로 잡아 준다.
- 같은 훅이 Codex CLI를 설치하고 로그인해 둔다. OpenAI API 키는 클라우드 프록시가 넣어 준다.
- `.env`처럼 비밀키가 들어 있는 파일은 읽거나 출력하지 않는다.
