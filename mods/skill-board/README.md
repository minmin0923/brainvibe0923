# skill-board (스킬 대시보드)

채팅 옆에 붙는 패널. 세션이 시작되면 자동으로 열리고, Claude가 스킬을 쓸 때마다 갱신된다.

- **설치된 스킬:** `.claude/skills/*/SKILL.md`를 읽어 이름, 언제 쓰는지, 설명, 이번 세션 사용 횟수를 보여 준다. 지금 쓰는 스킬은 강조된다.
- **UI 작업 순서 (자동 체크):** CLAUDE.md의 1~5단계. DESIGN.md를 읽거나 스킬을 쓰면 저절로 체크된다.
- **적용할 체크리스트:** `.claude/dashboard/checklist.md`를 보여 준다. 항목을 누르면 체크가 바뀌고 파일에 저장된다. Claude가 파일을 고쳐도 바로 반영된다.
- `/skill-board` 명령으로 언제든 다시 연다.

## 설치

```
/plugin install skill-board --marketplace minmin0923/brainvibe0923
```

레포의 `.claude/settings.json`에 아래를 넣으면 이 레포를 여는 세션마다 자동으로 켜진다.

```json
"extraKnownMarketplaces": {
  "brainvibe": { "source": { "source": "github", "repo": "minmin0923/brainvibe0923" } }
},
"enabledPlugins": { "skill-board@brainvibe": true }
```
