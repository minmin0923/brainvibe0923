import { expect, mock, test } from 'claude-code/testing'

const RUN = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const

const PANE = { title: '스킬 안내판', isFocused: false, bodyColumns: 60, placement: 'dock' } as const

for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
  test(`${surface}: 자동 열기 버튼이 켬/끔을 바꾼다`, async ($, on) => {
  mock.store(on)
    const ui = await $.ui.mount({ plugin: 'skill-panel', surface, component: 'Pane', requestId: 'skill-panel', props: PANE as never })
    expect((await ui.find({ key: 'auto' }))?.text).toContain('켬')
    await ui.press({ key: 'auto' })
    expect((await ui.find({ key: 'auto' }))?.text).toContain('끔')
    await ui.press({ key: 'auto' })
    expect((await ui.find({ key: 'auto' }))?.text).toContain('켬')
  })
}

test('/skill-board open, close 로 열고 닫는다', async ($, on) => {
  mock.store(on)
  on('ui.open', () => ({ value: { isPlaced: true } as const }))
  on('ui.close', () => ({ value: undefined }))
  const opened = await $.command.run({ ...RUN, command: 'skill-board', args: 'open' })
  expect(opened.text).toContain('열었습니다')
  const closed = await $.command.run({ ...RUN, command: 'skill-board', args: 'close' })
  expect(closed.text).toContain('닫았습니다')
})

test('/skill-board auto off 는 설정을 끈다', async ($, on) => {
  mock.store(on)
  const result = await $.command.run({ ...RUN, command: 'skill-board', args: 'auto off' })
  expect(result.text).toContain('자동으로 열지 않습니다')
})
