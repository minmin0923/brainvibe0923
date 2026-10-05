#!/usr/bin/env node
// PostToolUse(Skill) 훅: 스킬이 실제로 불렸을 때 화면에 알려 준다.
import { readFileSync } from 'node:fs'

try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const name = input.tool_input?.skill
  if (name) process.stdout.write(JSON.stringify({ systemMessage: `스킬 사용됨: ${name}` }))
} catch {}
