# agent-panel (에이전트 감독 창)

채팅 옆에 에이전트 모드의 상태를 보여 주는 창을 띄운다. 저장소 기본 브랜치의 `agent/INBOX.md`(기다리는 명령), `agent/LOG.md`(최근 일지), `agent/MEMORY.md`(기억 항목 수)와 `claude/agent-*` 작업 브랜치를 읽어서 보여 준다. 읽기만 하고 아무것도 바꾸지 않는다.

- `/agent-panel`: 창을 열거나 닫는다.
- `/agent-panel refresh`: 새로 불러온다. 5분마다 자동으로도 불러온다.
- 창 안의 "새로고침", "닫기" 버튼도 같은 일을 한다.
