import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Stats } from '../types'

const PANE = 'session-dashboard'
const TITLE = 'Dashboard'
const EMPTY: Stats = { prompts: 0, calls: 0, errors: 0, byTool: {}, files: [], recent: [] }
// Change the tag when Stats' fields change: it declines what an earlier
// version stored, which outlives a reload.
const stats = atom({ plugin: 'session-dashboard', key: 'stats' } as const, EMPTY, {
  shape: 'stats-1',
})
// Bumped by a timer so the elapsed time and usage figures redraw.
const tick = atom({ plugin: 'session-dashboard', key: 'tick' } as const, 0)

const bar = (n: number, max: number, width = 12) =>
  '█'.repeat(Math.max(1, Math.round((n / Math.max(1, max)) * width)))

const elapsed = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'dashboard',
      description: 'Open the session dashboard pane',
    })
    $.clock.every(30_000, () => void update($, tick, n => n + 1))
    void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'dashboard' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Dashboard opened.' }
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, stats, s => ({ ...s, prompts: s.prompts + 1 }))

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id
    const file = 'file_path' in e && typeof e.file_path === 'string' ? e.file_path : undefined
    await update($, stats, s => ({
      ...s,
      calls: s.calls + 1,
      byTool: { ...s.byTool, [e.tool]: (s.byTool[e.tool] ?? 0) + 1 },
      files: file && !s.files.includes(file) ? [...s.files, file].slice(-50) : s.files,
      recent: [...s.recent, { id, tool: e.tool, status: 'runs' as const }].slice(-8),
    }))
    const ran = await next(e)
    const isError = Boolean(ran.deny) || Boolean(ran.isError)
    await update($, stats, s => ({
      ...s,
      errors: s.errors + (isError ? 1 : 0),
      recent: s.recent.map(one =>
        one.id === id ? { ...one, status: isError ? ('error' as const) : ('done' as const) } : one,
      ),
    }))

    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const s = await read($, stats)
    await read($, tick)
    const usage = await $.session.usage()
    const now = await $.clock.now()
    const tools = Object.entries(s.byTool).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const top = tools[0]?.[1] ?? 0
    const pct = usage.context.percent

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>Session</Text>
          <Text>Elapsed   {elapsed(now - usage.startedAt)}</Text>
          <Text>Prompts   {s.prompts}</Text>
          <Text>
            Tools     {s.calls} calls, {s.errors} errors
          </Text>
          <Text>Files     {s.files.length} touched</Text>
          {pct !== undefined && <Text>Context   {Math.round(pct)}% of window</Text>}
          {usage.cost && <Text>Cost      ${usage.cost.usd.toFixed(2)}</Text>}
          {usage.rateLimits.map(r => (
            <Text dimColor>
              {r.kind} limit {Math.round(r.percentUsed)}%
            </Text>
          ))}
        </Box>
        <Box flexDirection="column">
          <Text bold>Top tools</Text>
          {tools.length === 0 && <Text dimColor>No tool calls yet.</Text>}
          {tools.map(([name, n]) => (
            <Text>
              {name.padEnd(10).slice(0, 10)} {bar(n, top)} {n}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column">
          <Text bold>Recent</Text>
          {s.recent.length === 0 && <Text dimColor>Nothing yet.</Text>}
          {s.recent
            .slice()
            .reverse()
            .map(one => (
              <Text dimColor={one.status === 'done'} color={one.status === 'error' ? 'red' : undefined}>
                {one.status} {one.tool}
              </Text>
            ))}
        </Box>
        <Button key="reset" label="Reset" onPress={() => update($, stats, () => EMPTY)} />
      </Box>
    )
  })
}
