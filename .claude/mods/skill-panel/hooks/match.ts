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
