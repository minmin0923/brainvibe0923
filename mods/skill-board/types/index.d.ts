export type SkillUse = { count: number; last: number }

declare module 'claude-code' {
  interface PluginState {
    'skill-board': {
      usage: Shaped<Record<string, SkillUse>>
      flow: Shaped<Record<string, boolean>>
      active: Shaped<string>
      rev: Shaped<number>
    }
  }
}
