# session-dashboard

Claude Code 세션 옆에 붙는 대시보드 패널입니다. 이번 세션의 경과 시간, 보낸 요청 수, 도구 호출 수와 오류 수, 다룬 파일 수, 컨텍스트 창 사용률, 비용, 많이 쓴 도구, 최근 도구 호출을 보여 줍니다.

- 세션이 시작되면 패널이 자동으로 열립니다. 닫았다면 `/dashboard`로 다시 엽니다.
- **Reset** 버튼은 집계를 0으로 되돌립니다.
- 이 저장소의 `.claude/settings.json`이 `brainvibe` 마켓플레이스(저장소 루트의 `.claude-plugin/marketplace.json`)와 이 플러그인을 켜 둡니다.

테스트: `claude plugin test plugins/session-dashboard`

다른 곳에서 설치하려면:

```
/plugin install session-dashboard --marketplace minmin0923/brainvibe0923
```
