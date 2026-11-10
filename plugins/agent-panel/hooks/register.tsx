import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { PanelStatus } from '../types'

const PANE = 'agent-panel'
const TITLE = '에이전트 감독'
const EMPTY: PanelStatus = {
  at: 0,
  error: '',
  branch: '',
  pending: [],
  log: [],
  branches: [],
  memory: 0,
}
const status = atom({ plugin: 'agent-panel', key: 'status' } as const, EMPTY, {
  shape: 'status-1',
})


// 저장소의 기본 브랜치에서 에이전트 파일을 읽어 온다. 파일을 바꾸지 않는다.
async function load($: any): Promise<PanelStatus> {
  const git = async (...args: string[]) => {
    const ran = await $.process.run(['git', ...args], { timeoutMs: 20000 })
    return ran.exitCode === 0 ? (ran.stdout as string) : ''
  }
  const at = await $.clock.now()
  try {
    const head = await git('ls-remote', '--symref', 'origin', 'HEAD')
    const branch = /ref: refs\/heads\/(\S+)\s+HEAD/.exec(head)?.[1] ?? ''
    if (!branch) return { ...EMPTY, at, error: '저장소에 연결하지 못했습니다.' }
    await git('fetch', '--quiet', '--prune', 'origin')
    const ref = `origin/${branch}`
    const inbox = await git('show', `${ref}:agent/INBOX.md`)
    const log = await git('show', `${ref}:agent/LOG.md`)
    const memory = await git('show', `${ref}:agent/MEMORY.md`)
    const remote = await git('branch', '-r', '--list', 'origin/claude/agent-*')
    if (!inbox && !log) {
      return { ...EMPTY, at, branch, error: 'agent/ 폴더를 찾지 못했습니다.' }
    }
    return {
      at,
      error: '',
      branch,
      pending: inbox
        .split('\n')
        .filter(line => /^\s*- \[ \]/.test(line))
        .map(line => line.replace(/^\s*- \[ \]\s*/, '').trim())
        .filter(Boolean),
      log: log
        .split('\n')
        .slice(1)
        .map(line => line.trimEnd())
        .filter(line => line && !line.startsWith('최신 실행이'))
        .slice(0, 30),
      branches: remote
        .split('\n')
        .map(line => line.trim().replace(/^origin\//, ''))
        .filter(Boolean),
      memory: memory.split('\n').filter(line => /^\s*- /.test(line)).length,
    }
  } catch (err) {
    return { ...EMPTY, at, error: `불러오기 실패: ${String(err)}` }
  }
}
async function refresh($: any): Promise<void> {
  const next = await load($)
  await update($, status, () => next)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agent-panel',
      description: '에이전트 감독 창을 열거나 닫는다 (refresh: 새로 불러오기)',
      argumentHint: '[open|close|refresh]',
    })
    const started = await next(e)
    void $.ui.open({ id: PANE, title: TITLE })
    void refresh($)
    // 5분마다 새로 불러온다.
    $.clock.every(5 * 60 * 1000, () => void refresh($))

    return started
  })

  on('command.run', { command: 'agent-panel' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const panes = await $.ui.panes()
    const isOpen = panes.some(pane => pane.id === PANE)
    if (arg === 'close' || (arg === '' && isOpen)) {
      await $.ui.close({ id: PANE })

      return { text: '에이전트 감독 창을 닫았습니다. /agent-panel 로 다시 엽니다.' }
    }
    await $.ui.open({ id: PANE, title: TITLE })
    await refresh($)

    return { text: '에이전트 감독 창을 열었습니다.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const now = await read($, status)
    const when = now.at
      ? new Date(now.at + 9 * 3600 * 1000).toISOString().slice(5, 16).replace('T', ' ')
      : ''

    return (
      <Box flexDirection="column">
        <Text dimColor>
          {now.at ? `${when} (한국 시간) 기준 · ${now.branch}` : '불러오는 중...'}
        </Text>
        {now.error !== '' && <Text color="red">{now.error}</Text>}
        <Text> </Text>
        <Text bold>기다리는 명령 {now.pending.length}건</Text>
        {now.pending.length === 0 && <Text dimColor>없음</Text>}
        {now.pending.slice(0, 10).map(item => (
          <Text>· {item}</Text>
        ))}
        <Text> </Text>
        <Text bold>작업 중인 브랜치 {now.branches.length}개</Text>
        {now.branches.length === 0 && <Text dimColor>없음</Text>}
        {now.branches.slice(0, 8).map(name => (
          <Text>· {name}</Text>
        ))}
        <Text> </Text>
        <Text bold>최근 일지</Text>
        {now.log.length === 0 && <Text dimColor>아직 실행 기록이 없습니다.</Text>}
        {now.log.map(line => (
          <Text dimColor={!line.startsWith('#')}>{line}</Text>
        ))}
        <Text> </Text>
        <Text dimColor>기억 {now.memory}항목 · 매일 08:47, 14:47, 20:47 실행</Text>
        <Box flexDirection="row">
          <Button onPress={() => refresh($)}>새로고침</Button>
          <Text> </Text>
          <Button onPress={() => $.ui.close({ id: PANE })}>닫기</Button>
        </Box>
      </Box>
    )
  })
}
