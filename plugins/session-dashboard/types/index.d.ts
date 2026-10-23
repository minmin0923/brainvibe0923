export type Stats = {
  prompts: number
  calls: number
  errors: number
  byTool: Record<string, number>
  files: string[]
  recent: { id: string; tool: string; status: 'runs' | 'done' | 'error' }[]
}

declare module 'claude-code' {
  interface PluginState {
    'session-dashboard': { stats: Shaped<Stats>; tick: number }
  }
}
