import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'skill-board',
  component: 'Pane',
  requestId: 'skill-board',
  props: {
    title: '스킬 대시보드',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const SKILL = `---\nname: agent-browser\ndescription: Browser automation CLI for AI agents. Use when needed.\n---\nbody`
const LIST = `# t\n## DESIGN.md 10장 점검표\n- [ ] 강조색이 하나뿐이다\n- [x] 토큰만 썼다\n`

test('스킬, 작업 순서, 체크리스트를 그리고 항목을 누르면 체크한다', async ($, on) => {
  const files: Record<string, string> = {
    '.claude/skills/agent-browser/SKILL.md': SKILL,
    '.claude/dashboard/checklist.md': LIST,
  }
  on('command.register', () => ({ value: { command: 'skill-board' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('fs.list', () => ({
    value: [{ name: 'agent-browser', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }],
  }))
  on('fs.read', (_, e) => {
    const key = Object.keys(files).find(k => e.path.endsWith(k))
    if (!key) throw new Error('missing ' + e.path)
    return { value: files[key] }
  })
  on('fs.write', (_, e) => {
    const key = Object.keys(files).find(k => e.path.endsWith(k)) ?? e.path
    files[key] = e.text
    return { value: undefined }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: '/repo/DESIGN.md' })
  await $.tool.call({ tool: 'Bash', command: 'agent-browser open file:///x.html' })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /설치된 스킬 1개/ }))?.text).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /agent-browser/ }))?.text).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /✓ 1\. DESIGN\.md 읽기/ }))?.text).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /✓ 3\. 눈으로 확인/ }))?.text).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /1\/2/ }))?.text).toBeDefined()
    await ui.unmount()
  }

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'item-2' })
  await new Promise(r => setTimeout(r, 0))
  expect(files['.claude/dashboard/checklist.md']).toContain('- [x] 강조색이 하나뿐이다')
  await ui.unmount()
})
