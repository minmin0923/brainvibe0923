#!/usr/bin/env node
// UserPromptSubmit 훅: 보낸 명령에 맞는 스킬을 화면에 한 줄로 알려 주고,
// "안내판 열어/닫아/자동 열기 꺼" 같은 말은 안내판 명령으로 처리한다.
import { readFileSync } from 'node:fs'
import { matchSkills } from './skill-match-core.mjs'
import { boardCommand, openInstruction, readBoard, writeBoard } from './skill-board-control.mjs'

function boardReply(command, root) {
  const board = readBoard(root)
  if (command === 'auto-on' || command === 'auto-off') {
    board.autoOpen = command === 'auto-on'
    writeBoard(root, board)
    return {
      systemMessage: board.autoOpen
        ? '스킬 안내판: 시작할 때 자동으로 엽니다.'
        : '스킬 안내판: 이제 시작할 때 자동으로 열지 않습니다. "안내판 열어"로 직접 엽니다.',
    }
  }
  if (command === 'open') {
    return {
      systemMessage: '스킬 안내판을 엽니다.',
      hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: openInstruction(board.url) },
    }
  }
  return {
    systemMessage: '스킬 안내판: 앱에서는 안내판 창의 닫기(X)를 누르면 닫힙니다. 터미널에서는 패널이 바로 닫힙니다.',
  }
}

try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || '.'
  const prompt = input.prompt || ''

  const command = boardCommand(prompt)
  if (command) {
    process.stdout.write(JSON.stringify(boardReply(command, root)))
  } else {
    const catalog = JSON.parse(readFileSync(`${root}/.claude/skill-catalog.json`, 'utf8'))
    const matches = matchSkills(prompt, catalog)

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
  }
} catch {
  // 안내판이 고장 나도 명령은 그대로 진행한다.
}
