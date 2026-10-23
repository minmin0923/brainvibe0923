import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'session-dashboard',
  component: 'Pane',
  requestId: 'session-dashboard',
  props: {
    title: 'Dashboard',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('the dashboard counts prompts and tool calls, on every surface', async ($, on) => {
  on('command.register', () => ({ value: { command: 'dashboard' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.now', () => ({ value: 600_000 }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200000, percent: 12 }, rateLimits: [], cost: { usd: 1.5 } },
  }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.prompt.submit({ text: 'hi' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: '/a.md' })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /Prompts/ }))?.text).toContain('1')
    expect((await ui.find({ type: 'Text', text: /Tools/ }))?.text).toContain('2 calls')
    expect((await ui.find({ type: 'Text', text: /Files/ }))?.text).toContain('1 touched')
    expect((await ui.find({ type: 'Text', text: /Elapsed/ }))?.text).toContain('10m')
    await ui.unmount()
  }
})
