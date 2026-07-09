import type { ComponentType } from 'react'
import type { Level } from '../content/curriculum'

/**
 * A curriculum fixture whose levels hold *several* modules, so tests can exercise
 * per-module expand/collapse in the sidebar. The main `curriculumFixture` gives
 * every level exactly one module, which cannot distinguish "the active module is
 * open" from "every module is open".
 */

function heading(title: string): ComponentType {
  return function LessonBody() {
    return <h1>{title}</h1>
  }
}

const body = (Component: ComponentType) => () => Promise.resolve({ default: Component })

export const curriculum: Level[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    modules: [
      {
        id: 'basics',
        title: 'The Basics',
        lessons: [
          {
            id: 'what-is-cc',
            dottedId: 'B1.1',
            title: 'What is Claude Code?',
            docsSources: ['https://code.claude.com/docs/en/overview'],
            content: body(heading('What is Claude Code?')),
          },
        ],
      },
      {
        id: 'sessions',
        title: 'Sessions',
        lessons: [
          {
            id: 'first-session',
            dottedId: 'B2.1',
            title: 'Your First Session',
            docsSources: ['https://code.claude.com/docs/en/quickstart'],
            content: body(heading('Your First Session')),
          },
        ],
      },
      {
        id: 'context',
        title: 'Context',
        lessons: [
          {
            id: 'context-window',
            dottedId: 'B3.1',
            title: 'The Context Window',
            docsSources: ['https://code.claude.com/docs/en/context-window'],
            content: body(heading('The Context Window')),
          },
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
          {
            id: 'slash-commands',
            dottedId: 'I1.1',
            title: 'Slash Commands',
            docsSources: ['https://code.claude.com/docs/en/commands'],
            content: body(heading('Slash Commands')),
          },
        ],
      },
    ],
  },
]

export const lessonPathById: Record<string, string> = {
  'B1.1': '/learn/beginner/basics/what-is-cc',
  'B2.1': '/learn/beginner/sessions/first-session',
  'B3.1': '/learn/beginner/context/context-window',
  'I1.1': '/learn/intermediate/workflows/slash-commands',
}
