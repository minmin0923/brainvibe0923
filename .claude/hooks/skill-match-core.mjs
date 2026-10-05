// 명령 문장에서 맞는 스킬을 찾는다. 훅과 스킬 안내판 페이지가 같이 쓴다.
// 이 함수는 안내판 페이지에 소스 그대로 들어가므로 바깥 변수를 쓰지 않는다.
export function matchSkills(text, catalog) {
  const lower = text.toLowerCase()
  const isAscii = word => /^[\x00-\x7f]+$/.test(word)
  const has = word => {
    const w = word.toLowerCase()
    if (!isAscii(w)) return lower.includes(w)
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(lower)
  }
  const found = new Map()
  const add = (name, hit) => {
    if (!found.has(name)) found.set(name, [])
    if (!found.get(name).includes(hit)) found.get(name).push(hit)
  }

  for (const skill of catalog.skills) {
    const short = skill.name.split(':').pop()
    if (lower.includes(`/${skill.name}`) || has(`/${short}`)) add(skill.name, `/${short}`)
    for (const word of skill.keywords) if (has(word)) add(skill.name, word)
  }

  const rule = catalog.uiRule
  const uiHit = rule && rule.words.find(has)
  if (uiHit) for (const name of rule.skills) add(name, `${rule.label}(${uiHit})`)

  return [...found]
    .map(([name, hits]) => ({ name, hits }))
    .sort((a, b) => b.hits.length - a.hits.length)
}
