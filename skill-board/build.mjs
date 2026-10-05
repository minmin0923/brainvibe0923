// .claude/skill-catalog.json과 훅의 판별 함수로 스킬 안내판 페이지(index.html)를 만든다.
import { readFileSync, writeFileSync } from 'node:fs'
import { matchSkills } from '../.claude/hooks/skill-match-core.mjs'

const here = new URL('.', import.meta.url)
const catalog = JSON.parse(readFileSync(new URL('../.claude/skill-catalog.json', here), 'utf8'))
const template = readFileSync(new URL('template.html', here), 'utf8')

const html = template
  .replace('__CATALOG__', () => JSON.stringify(catalog).replace(/</g, '\\u003c'))
  .replace('__MATCHER__', () => matchSkills.toString())

writeFileSync(new URL('index.html', here), html)
console.log(`skill-board/index.html: 스킬 ${catalog.skills.length}개`)
