#!/usr/bin/env node
// UserPromptSubmit 훅: 보낸 명령에 맞는 스킬을 화면에 한 줄로 알려 준다.
import { readFileSync } from 'node:fs'
import { matchSkills } from './skill-match-core.mjs'

try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || '.'
  const catalog = JSON.parse(readFileSync(`${root}/.claude/skill-catalog.json`, 'utf8'))
  const matches = matchSkills(input.prompt || '', catalog)

  const line = matches.length === 0
    ? '스킬 체크: 맞는 스킬 없음 (일반 작업으로 진행)'
    : `스킬 체크: ${matches.slice(0, 4).map(m => `${m.name} (${m.hits.slice(0, 2).join(', ')})`).join(' · ')}`

  const out = { systemMessage: line }
  if (matches.length > 0) {
    out.hookSpecificOutput = {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `스킬 안내판이 이 명령에서 찾은 후보: ${matches.map(m => m.name).join(', ')}. 단어로 고른 후보일 뿐이니, 실제로 맞을 때만 Skill 도구로 불러 쓴다.`,
    }
  }
  process.stdout.write(JSON.stringify(out))
} catch {
  // 안내판이 고장 나도 명령은 그대로 진행한다.
}
