export interface ModuleDef {
  /** Dotted-id prefix / join key (e.g. "B1"). */
  code: string
  /** URL segment (e.g. "basics"). */
  slug: string
  title: string
  order: number
}

export interface LevelDef {
  id: string
  title: string
  order: number
  modules: ModuleDef[]
}

export const structure: LevelDef[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    order: 1,
    modules: [{ code: 'B1', slug: 'meet-claude-code', title: 'Meet Claude Code', order: 1 }, { code: 'B2', slug: 'sessions-and-context', title: 'Sessions and Context', order: 2 }, { code: 'B3', slug: 'teaching-claude-your-project', title: 'Teaching Claude Your Project', order: 3 }, { code: 'B4', slug: 'the-beginner-workflow', title: 'The Beginner Workflow', order: 4 }, { code: 'B5', slug: 'guided-project-shelf', title: 'Guided Project: Shelf', order: 5 }],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    order: 2,
    modules: [{ code: 'I0', slug: 'level-overview', title: 'Level Overview', order: 0 }, { code: 'I1', slug: 'tools-permissions-settings', title: 'Tools, Permissions, Settings', order: 1 }],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    order: 3,
    modules: [],
  },
]
