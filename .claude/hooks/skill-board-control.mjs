// 스킬 안내판 설정(.claude/skill-board.json)과 "안내판 열어/닫아/자동 열기 꺼" 같은 말 알아듣기.
import { readFileSync, writeFileSync } from 'node:fs'

const SETTINGS = '.claude/skill-board.json'

export function readBoard(root) {
  try {
    return { autoOpen: true, ...JSON.parse(readFileSync(`${root}/${SETTINGS}`, 'utf8')) }
  } catch {
    return { autoOpen: true }
  }
}

export function writeBoard(root, board) {
  const { url, autoOpen, ...rest } = board
  writeFileSync(`${root}/${SETTINGS}`, `${JSON.stringify({ url, autoOpen, ...rest }, null, 2)}\n`)
}

// 안내판을 가리키는 말이 있을 때만 명령으로 본다. 없으면 null.
export function boardCommand(text) {
  const t = text.replace(/\s+/g, ' ').trim().toLowerCase()
  if (!/(스킬 ?)?안내판|skill-board/.test(t)) return null
  if (/자동/.test(t) || /\bauto\b/.test(t)) {
    if (/(꺼|끄|끔|off|안 ?열|열지 ?마)/.test(t)) return 'auto-off'
    if (/(켜|켬|on)/.test(t) || /열(어|기|리게)/.test(t)) return 'auto-on'
    return null
  }
  if (/(닫|숨|치워|close)/.test(t)) return 'close'
  if (/(열어|열기|띄워|보여|open)/.test(t)) return 'open'
  return null
}

export function openInstruction(url) {
  return `스킬 안내판(${url})을 Artifact 도구의 action "open"으로 사용자에게 열어 준다. 한 번만 열고, 열었다는 말은 한 줄로 한다.`
}
