#!/usr/bin/env node
// SessionStart 훅: 자동 열기가 켜져 있으면 Claude가 첫 답에서 스킬 안내판을 열게 한다.
import { readFileSync } from 'node:fs'
import { openInstruction, readBoard } from './skill-board-control.mjs'

try {
  let input = {}
  try { input = JSON.parse(readFileSync(0, 'utf8')) } catch {}
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || '.'
  const board = readBoard(root)
  if (board.autoOpen && board.url && (input.source ?? 'startup') !== 'compact') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `[스킬 안내판 자동 열기 켜짐] 이번 세션의 첫 답을 시작할 때, 다른 작업보다 먼저 ${openInstruction(board.url)} 사용자가 "안내판 자동 열기 꺼 줘"라고 하면 꺼진다.`,
      },
    }))
  }
} catch {}
