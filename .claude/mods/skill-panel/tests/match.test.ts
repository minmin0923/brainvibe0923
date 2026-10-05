import { expect, test } from 'claude-code/testing'

import { matchSkills } from '../hooks/match'

const catalog = {
  uiRule: { label: '화면 규칙', words: ['화면', 'ui'], skills: ['agent-browser'] },
  skills: [
    { name: 'agent-browser', group: 'project', summary: '', keywords: ['브라우저'] },
    { name: 'dataviz', group: 'builtin', summary: '', keywords: ['차트', 'chart'] },
    { name: 'anthropic-skills:pdf', group: 'anthropic', summary: '', keywords: ['pdf'] },
  ],
}

test('한국어 단어로 스킬을 찾는다', async () => {
  expect(matchSkills('매출 차트 그려 줘', catalog).map(m => m.name)).toEqual(['dataviz'])
})

test('영문 단어는 단어 단위로만 맞춘다', async () => {
  expect(matchSkills('build the guide quickly', catalog)).toEqual([])
  expect(matchSkills('draw a chart', catalog).map(m => m.name)).toEqual(['dataviz'])
})

test('슬래시 명령과 화면 규칙을 알아본다', async () => {
  expect(matchSkills('/pdf 합쳐 줘', catalog)[0]?.name).toBe('anthropic-skills:pdf')
  expect(matchSkills('화면 고쳐 줘', catalog)[0]?.hits).toEqual(['화면 규칙(화면)'])
})
