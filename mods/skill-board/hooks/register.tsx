import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const PANE = 'skill-board'
const TITLE = '스킬 대시보드'
const SKILLS_DIR = '.claude/skills'
const CHECKLIST = '.claude/dashboard/checklist.md'

// 이번 세션 동안의 기록. 필드가 바뀌면 shape 태그를 올린다.
const usage = atom({ plugin: 'skill-board', key: 'usage' } as const, {}, { shape: 'usage-1' })
const flow = atom({ plugin: 'skill-board', key: 'flow' } as const, {}, { shape: 'flow-1' })
const active = atom({ plugin: 'skill-board', key: 'active' } as const, '', { shape: 'active-1' })
const rev = atom({ plugin: 'skill-board', key: 'rev' } as const, 0, { shape: 'rev-1' })

// CLAUDE.md "화면(UI) 작업 순서"
const STEPS = [
  { id: 'design', label: '1. DESIGN.md 읽기' },
  { id: 'build', label: '2. 만들기 (image-to-code / design-taste-frontend)' },
  { id: 'browse', label: '3. 눈으로 확인 (agent-browser)' },
  { id: 'review', label: '4. 점검 (web-design-guidelines)' },
  { id: 'report', label: '5. 완료 보고 (DESIGN.md 10장 점검표)' },
] as const

// 스킬별 "언제 쓰나" (CLAUDE.md 기준)
const WHEN: Record<string, string> = {
  'image-to-code': '참고 이미지·시안이 있을 때 → 2단계',
  'design-taste-frontend': '랜딩·포트폴리오·리디자인 → 2단계',
  'agent-browser': '360/768/1280px, 라이트/다크 스크린샷 → 3단계',
  'web-design-guidelines': '바뀐 파일 점검 → 4단계',
  'openai-image': '이미지·시안·썸네일이 필요할 때 (OpenAI) → generated/images',
}
const STEP_OF: Record<string, string> = {
  'image-to-code': 'build',
  'design-taste-frontend': 'build',
  'agent-browser': 'browse',
  'web-design-guidelines': 'review',
}

type Skill = { name: string; description: string }
type Item = { line: number; done: boolean; text: string }
type Section = { title: string; items: Item[] }

const bare = (name: string) => name.split(':').pop() ?? name

const firstSentence = (text: string) => {
  const one = text.replace(/\s+/g, ' ').trim()
  const cut = one.search(/\.\s/)
  const s = cut > 0 ? one.slice(0, cut + 1) : one

  return s.length > 110 ? `${s.slice(0, 107)}...` : s
}

const frontmatter = (text: string, key: string) => {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))

  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}

const parseChecklist = (text: string): Section[] => {
  const sections: Section[] = []
  text.split('\n').forEach((raw, line) => {
    const head = raw.match(/^##\s+(.+)/)
    if (head) {
      sections.push({ title: head[1].trim(), items: [] })
      return
    }
    const item = raw.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.+)/)
    if (item) {
      if (sections.length === 0) sections.push({ title: '체크리스트', items: [] })
      sections[sections.length - 1].items.push({
        line,
        done: item[1] !== ' ',
        text: item[2].trim(),
      })
    }
  })

  return sections
}

function openPane($: EngineInterface) {
  return $.ui.open({ id: PANE, title: TITLE })
}

async function markUsed($: EngineInterface, name: string) {
  const skill = bare(name)
  await update($, usage, all => ({
    ...all,
    [skill]: { count: (all[skill]?.count ?? 0) + 1, last: Date.now() },
  }))
  await update($, active, () => skill)
  const step = STEP_OF[skill]
  if (step) await update($, flow, f => ({ ...f, [step]: true }))
  $.ui.status(`스킬 사용 중: ${skill}`)
  void $.ui.open({ id: PANE, title: TITLE })
}

async function refreshChecklist($: EngineInterface) {
  await update($, rev, n => n + 1)
  void $.ui.open({ id: PANE, title: TITLE })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'skill-board',
      description: '스킬 대시보드 패널 열기',
    })
    void openPane($)

    return next(e)
  })

  on('command.run', { command: 'skill-board' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: '스킬 대시보드를 열었습니다.' }
  })

  // 스킬이 펼쳐질 때(/이름, Skill 도구, 미리 불러오기)
  on('skill.prompt', async ($, e, next) => {
    await markUsed($, e.skill)

    return next(e)
  })

  // agent-browser는 Bash로 직접 부르기도 한다
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (/\bagent-browser\b/.test(e.command)) {
      await update($, flow, f => ({ ...f, browse: true }))
      await update($, active, () => 'agent-browser')
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const ran = await next(e)
    if (/(^|\/)DESIGN\.md$/.test(e.file_path)) {
      await update($, flow, f => ({ ...f, design: true }))
      void openPane($)
    }

    return ran
  }).catch(($, e, next) => next(e))

  // Claude가 체크리스트 파일을 고치면 패널을 다시 그린다
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.file_path.endsWith(CHECKLIST)) await refreshChecklist($)

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.file_path.endsWith(CHECKLIST)) await refreshChecklist($)

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    await read($, rev)
    const used = await read($, usage)
    const steps = await read($, flow)
    const now = await read($, active)

    // 1) 설치된 스킬
    const skills: Skill[] = []
    try {
      const entries = await $.fs.list(SKILLS_DIR)
      for (const entry of entries.filter(x => x.kind !== 'file').sort((a, b) => a.name.localeCompare(b.name))) {
        try {
          const text = await $.fs.read(`${SKILLS_DIR}/${entry.name}/SKILL.md`)
          skills.push({
            name: frontmatter(text, 'name') || entry.name,
            description: firstSentence(frontmatter(text, 'description')),
          })
        } catch {
          // SKILL.md가 없는 폴더는 건너뛴다
        }
      }
    } catch {
      // 스킬 폴더 없음
    }

    // 2) 적용할 체크리스트
    let sections: Section[] = []
    let raw = ''
    try {
      raw = await $.fs.read(CHECKLIST)
      sections = parseChecklist(raw)
    } catch {
      raw = ''
    }

    const designDone = sections
      .filter(s => s.title.includes('10장'))
      .every(s => s.items.length > 0 && s.items.every(i => i.done))
    const isStepDone = (id: string) => (id === 'report' ? designDone && sections.length > 0 : !!steps[id])

    const toggle = (item: Item) => () => {
      void (async () => {
        const text = await $.fs.read(CHECKLIST)
        const lines = text.split('\n')
        const line = lines[item.line] ?? ''
        lines[item.line] = item.done
          ? line.replace(/\[(x|X)\]/, '[ ]')
          : line.replace('[ ]', '[x]')
        await $.fs.write(CHECKLIST, lines.join('\n'))
        await update($, rev, n => n + 1)
      })()
    }

    const total = sections.reduce((n, s) => n + s.items.length, 0)
    const done = sections.reduce((n, s) => n + s.items.filter(i => i.done).length, 0)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold size="heading">설치된 스킬 {skills.length}개</Text>
          {now !== '' && <Text color="claude">지금: {now}</Text>}
          {skills.length === 0 && <Text dimColor>.claude/skills 에 스킬이 없습니다.</Text>}
          {skills.map(skill => {
            const use = used[skill.name]
            return (
              <Box key={skill.name} flexDirection="column" marginTop={1}>
                <Text bold color={skill.name === now ? 'claude' : undefined}>
                  {use ? '●' : '○'} {skill.name}
                  {use ? `  · ${use.count}회 사용` : ''}
                </Text>
                {WHEN[skill.name] && <Text color="suggestion">  {WHEN[skill.name]}</Text>}
                <Text dimColor>  {skill.description}</Text>
              </Box>
            )
          })}
        </Box>

        <Box flexDirection="column">
          <Text bold size="heading">UI 작업 순서 (자동 체크)</Text>
          {STEPS.map(step => (
            <Text key={step.id} color={isStepDone(step.id) ? 'success' : undefined} dimColor={!isStepDone(step.id)}>
              {isStepDone(step.id) ? '✓' : '·'} {step.label}
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold size="heading">
            적용할 체크리스트 {total > 0 ? `${done}/${total}` : ''}
          </Text>
          {raw === '' && <Text dimColor>{CHECKLIST} 파일을 만들면 여기에 보입니다.</Text>}
          {sections.map(section => (
            <Box key={section.title} flexDirection="column" marginTop={1}>
              <Text weight="semibold">{section.title}</Text>
              {section.items.map(item => (
                <Button key={`item-${item.line}`} plain onPress={toggle(item)} label={item.text}>
                  <Text color={item.done ? 'success' : undefined} strikethrough={item.done} dimColor={item.done}>
                    {item.done ? '☑' : '☐'} {item.text}
                  </Text>
                </Button>
              ))}
            </Box>
          ))}
          <Text dimColor>항목을 누르면 체크됩니다 · /skill-board 로 다시 열기</Text>
        </Box>
      </Box>
    )
  })
}
