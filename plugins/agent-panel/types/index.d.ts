export type PanelStatus = {
  /** 불러온 시각 (ms). 0이면 아직 불러오지 않음 */
  at: number
  /** 불러오기 실패 이유. 성공이면 빈 문자열 */
  error: string
  /** 기준 브랜치 이름 */
  branch: string
  /** INBOX의 아직 안 한 명령 */
  pending: string[]
  /** LOG의 최근 줄 */
  log: string[]
  /** 에이전트가 작업 중인 브랜치 */
  branches: string[]
  /** MEMORY에 쌓인 항목 수 */
  memory: number
}

declare module 'claude-code' {
  interface PluginState {
    'agent-panel': { status: Shaped<PanelStatus> }
  }
}
