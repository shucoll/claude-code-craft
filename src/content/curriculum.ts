import type { ComponentType } from 'react'

export interface Lesson {
  id: string
  title: string
  content: () => Promise<{ default: ComponentType }>
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Level {
  id: string
  title: string
  modules: Module[]
}

export const curriculum: Level[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    modules: [
      {
        id: 'basics',
        title: 'The Basics',
        lessons: [
          { id: 'what-is-cc', title: 'What is Claude Code?', content: () => import('./lessons/beginner/what-is-cc.mdx') },
          { id: 'first-edit', title: 'Your First Edit', content: () => import('./lessons/beginner/first-edit.mdx') },
          { id: 'review-changes', title: 'Reviewing Changes', content: () => import('./lessons/beginner/review-changes.mdx') },
        ],
      },
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    modules: [
      {
        id: 'workflows',
        title: 'Workflows',
        lessons: [
          { id: 'slash-commands', title: 'Slash Commands', content: () => import('./lessons/intermediate/slash-commands.mdx') },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    modules: [
      {
        id: 'power',
        title: 'Power User',
        lessons: [
          { id: 'subagents', title: 'Subagents', content: () => import('./lessons/advanced/subagents.mdx') },
        ],
      },
    ],
  },
]
