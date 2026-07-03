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
    modules: [{ code: 'B1', slug: 'basics', title: 'The Basics', order: 1 }],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    order: 2,
    modules: [{ code: 'I1', slug: 'workflows', title: 'Workflows', order: 1 }],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    order: 3,
    modules: [{ code: 'A1', slug: 'power', title: 'Power User', order: 1 }],
  },
]
