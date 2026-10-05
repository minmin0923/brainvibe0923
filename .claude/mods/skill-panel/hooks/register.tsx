import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Catalog } from '../types'
import { matchSkills } from './match'

const PANE = 'skill-panel'
const TITLE = '스킬 안내판'
const CATALOG_PATH = '.claude/skill-catalog.json'

const last = atom({ plugin: 'skill-panel', key: 'last' } as const, null)
const catalog = atom({ plugin: 'skill-panel', key: 'catalog' } as const, [])
const isExpanded = atom({ plugin: 'skill-panel', key: 'isExpanded' } as const, true)

async function loadCatalog($: EngineInterface): Promise<Catalog> {
  try {
    const parsed = JSON.parse(await $.fs.read(CATALOG_PATH)) as Catalog
    await update($, catalog, () => parsed.skills)
    return parsed
  } catch {
    return { skills: await read($, catalog) }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'skills', description: '스킬 안내판 패널 열기' })
    await $.command.register({
      name: 'skills-check',
      description: '명령을 보내지 않고 맞는 스킬만 확인',
      argumentHint: '[명령]',
    })
    await loadCatalog($)
    void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'skills' }, async $ => {
    await loadCatalog($)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: '스킬 안내판을 열었습니다.' }
  })

  on('command.run', { command: 'skills-check' }, async ($, e) => {
    const matches = matchSkills(e.args, await loadCatalog($))
    await update($, last, () => ({ text: e.args, matches, used: [] }))
    await $.ui.open({ id: PANE, title: TITLE })
    if (matches.length === 0) return { text: '맞는 스킬 없음' }

    return { text: matches.map(m => `${m.name}  (${m.hits.join(', ')})`).join('\n') }
  })

  on('prompt.submit', async ($, e, next) => {
    if (!e.text.trim().startsWith('/skills')) {
      const matches = matchSkills(e.text, await loadCatalog($))
      await update($, last, () => ({ text: e.text, matches, used: [] }))
      $.ui.status(matches.length ? `스킬 후보: ${matches.map(m => m.name).join(', ')}` : undefined)
    }

    return next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    await update($, last, prev =>
      prev && !prev.used.includes(e.skill) ? { ...prev, used: [...prev.used, e.skill] } : prev,
    )
    $.ui.toast(`스킬 사용됨: ${e.skill}`)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const prompt = await read($, last)
    const skills = await read($, catalog)
    const expanded = await read($, isExpanded)
    const matched = new Set(prompt?.matches.map(m => m.name) ?? [])

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>방금 보낸 명령</Text>
          {prompt === null && <Text dimColor>아직 보낸 명령이 없습니다.</Text>}
          {prompt !== null && <Text dimColor wrap="truncate-end">{prompt.text}</Text>}
          {prompt !== null && prompt.matches.length === 0 && <Text>맞는 스킬 없음</Text>}
          {prompt?.matches.map(m => (
            <Text key={m.name}>
              {prompt.used.includes(m.name) ? '● 사용됨 ' : '○ 후보   '}
              <Text bold>{m.name}</Text>
              <Text dimColor> {m.hits.join(', ')}</Text>
            </Text>
          ))}
          {prompt?.used
            .filter(name => !matched.has(name))
            .map(name => (
              <Text key={`used-${name}`}>
                ● 사용됨 <Text bold>{name}</Text>
                <Text dimColor> (단어 목록에는 없던 스킬)</Text>
              </Text>
            ))}
        </Box>
        <Box flexDirection="column">
          <Box gap={1}>
            <Text bold>전체 스킬 {skills.length}개</Text>
            <Button
              key="toggle"
              label={expanded ? '접기' : '펼치기'}
              onPress={() => update($, isExpanded, v => !v)}
            />
          </Box>
          {expanded &&
            skills.map(s => (
              <Text key={s.name} wrap="truncate-end" dimColor={!matched.has(s.name)}>
                <Text bold={matched.has(s.name)}>{s.name}</Text> {s.summary}
              </Text>
            ))}
        </Box>
      </Box>
    )
  })
}
