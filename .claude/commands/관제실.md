---
description: 에이전트 관제실을 열고 지금 상태를 요약한다
---

에이전트 관제실을 연다.

1. `Artifact` 도구의 `action: "open"`으로 https://claude.ai/artifact/PhVkovV8DEeonV949DC6qF 를 연다.
2. `ArtifactData`로 같은 주소의 `commands`(최근 10건), `agent/state`, `agent/settings`를 읽어 세 줄로 요약한다: 에이전트가 켜져 있는지, 진행 중이거나 확인이 필요한 지시, 가장 최근 결과.
3. 사용자가 뒤에 글을 붙였으면($ARGUMENTS) 그것을 새 지시로 보고 `commands`에 `{kind: "command", role: "auto", status: "queued", text, createdAt, updatedAt, steps: [], result: "", links: []}` 문서를 만든 뒤, 에이전트 본부 세션(session_016Lmrda16KxAjjNTmkFheZ2)에 `send_message`로 "관제실에 새 지시가 도착했습니다. agent/RUNBOOK.md를 따라 처리하세요."를 보낸다. `agent/settings.enabled`가 false면 깨우지 않고 그렇다고 알린다.
