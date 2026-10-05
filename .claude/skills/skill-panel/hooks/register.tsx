import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Catalog } from '../types'
import { boardCommand, matchSkills } from './match'

const PANE = 'skill-panel'
const TITLE = '스킬 안내판'
const CATALOG_PATH = '.claude/skill-catalog.json'
const AUTO_OPEN_KEY = 'autoOpen'

const last = atom({ plugin: 'skill-panel', key: 'last' } as const, null)
const catalog = atom({ plugin: 'skill-panel', key: 'catalog' } as const, [])
const isExpanded = atom({ plugin: 'skill-panel', key: 'isExpanded' } as const, true)
const autoOpen = atom({ plugin: 'skill-panel', key: 'autoOpen' } as const, true)

async function loadCatalog($: EngineInterface): Promise<Catalog> {
  try {
    const parsed = JSON.parse(await $.fs.read(CATALOG_PATH)) as Catalog
    await update($, catalog, () => parsed.skills)
    return parsed
  } catch {
    return { skills: await read($, catalog) }
  }
}

async function isOpen($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(pane => pane.id === PANE)
}

async function openPane($: EngineInterface): Promise<string> {
  await loadCatalog($)
  const opened = await $.ui.open({ id: PANE, title: TITLE })

  return opened.isPlaced ? '스킬 안내판을 열었습니다.' : '스킬 안내판을 열었습니다. 창이 좁으면 넓혔을 때 보입니다.'
}

async function closePane($: EngineInterface): Promise<string> {
  await $.ui.close({ id: PANE })

  return '스킬 안내판을 닫았습니다. /skill-board 로 다시 엽니다.'
}

// 세션이 바뀌어도 남는 설정이라 $.store에 두고, 그리기용으로 atom에도 비춘다.
async function setAutoOpen($: EngineInterface, value: boolean): Promise<string> {
  await $.store.set(AUTO_OPEN_KEY, value)
  await update($, autoOpen, () => value)

  return value ? 'Claude를 시작할 때 스킬 안내판을 자동으로 엽니다.' : '이제 시작할 때 자동으로 열지 않습니다. /skill-board 로 직접 엽니다.'
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'skill-board',
      description: '스킬 안내판 열기/닫기 (auto on|off: 시작할 때 자동 열기)',
      argumentHint: '[open|close|auto on|auto off]',
      immediate: true,
    })
    await $.command.register({
      name: 'skill-board-check',
      description: '명령을 보내지 않고 맞는 스킬만 확인',
      argumentHint: '[명령]',
    })

    const stored = await $.store.get(AUTO_OPEN_KEY)
    const shouldOpen = stored !== false
    await update($, autoOpen, () => shouldOpen)
    await loadCatalog($)
    if (shouldOpen) void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'skill-board' }, async ($, e) => {
    const arg = (e.args ?? '').trim().toLowerCase()
    if (arg === 'auto on' || arg === '자동 켜기') return { text: await setAutoOpen($, true) }
    if (arg === 'auto off' || arg === '자동 끄기') return { text: await setAutoOpen($, false) }
    if (arg === 'open' || arg === '열기') return { text: await openPane($) }
    if (arg === 'close' || arg === '닫기') return { text: await closePane($) }

    return { text: (await isOpen($)) ? await closePane($) : await openPane($) }
  })

  on('command.run', { command: 'skill-board-check' }, async ($, e) => {
    const matches = matchSkills(e.args ?? '', await loadCatalog($))
    await update($, last, () => ({ text: e.args ?? '', matches, used: [] }))
    if (!(await isOpen($))) await $.ui.open({ id: PANE, title: TITLE })
    if (matches.length === 0) return { text: '맞는 스킬 없음' }

    return { text: matches.map(m => `${m.name}  (${m.hits.join(', ')})`).join('\n') }
  })

  on('prompt.submit', async ($, e, next) => {
    const command = e.text.trim().startsWith('/') ? null : boardCommand(e.text)
    if (command === 'open') $.ui.toast(await openPane($))
    if (command === 'close') $.ui.toast(await closePane($))
    if (command === 'auto-on' || command === 'auto-off') $.ui.toast(await setAutoOpen($, command === 'auto-on'))
    if (command === null && !e.text.trim().startsWith('/skill-board')) {
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
    const auto = await read($, autoOpen)
    const matched = new Set(prompt?.matches.map(m => m.name) ?? [])

    return (
      <Box flexDirection="column" gap={1}>
        <Box gap={1} flexWrap="wrap">
          <Button key="close" role="dismiss" label="닫기" onPress={() => void closePane($)} />
          <Button
            key="auto"
            label={auto ? '시작 시 자동 열기: 켬' : '시작 시 자동 열기: 끔'}
            onPress={() => void setAutoOpen($, !auto)}
          />
        </Box>
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
