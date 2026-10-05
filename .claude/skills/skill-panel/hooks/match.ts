import type { Catalog, SkillMatch } from '../types'

// .claude/hooks/skill-match-core.mjs와 같은 규칙. 둘 중 하나를 고치면 다른 쪽도 고친다.
export function matchSkills(text: string, catalog: Catalog): SkillMatch[] {
  const lower = text.toLowerCase()
  const has = (word: string) => {
    const w = word.toLowerCase()
    if (!/^[\x00-\x7f]+$/.test(w)) return lower.includes(w)
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(lower)
  }
  const found = new Map<string, string[]>()
  const add = (name: string, hit: string) => {
    const hits = found.get(name) ?? []
    if (!hits.includes(hit)) hits.push(hit)
    found.set(name, hits)
  }

  for (const skill of catalog.skills) {
    const short = skill.name.split(':').pop() ?? skill.name
    if (lower.includes(`/${skill.name}`) || has(`/${short}`)) add(skill.name, `/${short}`)
    for (const word of skill.keywords) if (has(word)) add(skill.name, word)
  }

  const rule = catalog.uiRule
  const uiHit = rule?.words.find(has)
  if (rule && uiHit) for (const name of rule.skills) add(name, `${rule.label}(${uiHit})`)

  return [...found]
    .map(([name, hits]) => ({ name, hits }))
    .sort((a, b) => b.hits.length - a.hits.length)
}

export type BoardCommand = 'open' | 'close' | 'auto-on' | 'auto-off'

// .claude/hooks/skill-board-control.mjs의 boardCommand와 같은 규칙.
export function boardCommand(text: string): BoardCommand | null {
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
