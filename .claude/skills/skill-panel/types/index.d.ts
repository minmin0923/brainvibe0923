export type SkillMatch = { name: string; hits: string[] }

export type SkillRow = { name: string; group: string; summary: string; keywords: string[] }

export type Catalog = {
  uiRule?: { label: string; words: string[]; skills: string[] }
  skills: SkillRow[]
}

export type LastPrompt = { text: string; matches: SkillMatch[]; used: string[] }

declare module 'claude-code' {
  interface PluginState {
    'skill-panel': {
      last: LastPrompt | null
      catalog: SkillRow[]
      isExpanded: boolean
      autoOpen: boolean
    }
  }
}
