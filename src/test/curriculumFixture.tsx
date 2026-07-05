import type { ComponentType } from 'react'
import type { Level } from '../content/curriculum'

/**
 * A stable, synthetic curriculum used by tests that exercise curriculum-driven
 * behavior (navigation, cross-links, the sidebar, landing/back logic). It mirrors
 * the shape of the generated `curriculum.ts` so tests assert against fixed data
 * instead of real lesson content — authoring or removing real lessons then never
 * breaks these tests. Mock the real module onto this in a test with:
 *
 *   vi.mock('../content/curriculum', async () => await import('../test/curriculumFixture'))
 */

/** A lesson body that renders its title as a heading. */
function heading(title: string): ComponentType {
  return function LessonBody() {
    return <h1>{title}</h1>
  }
}

/** The advanced lesson body also exposes a `#chart-demo` anchor for scroll-restore tests. */
function subagentsBody(): ComponentType {
  return function SubagentsBody() {
    return (
      <>
        <h1>Subagents</h1>
        <div id="chart-demo">
          <button type="button">Beginner</button>
        </div>
      </>
    )
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
            references: ['B1.2'],
            docsSources: [
              'https://code.claude.com/docs/en/overview',
              'https://code.claude.com/docs/en/how-claude-code-works',
            ],
            content: body(heading('What is Claude Code?')),
          },
          {
            id: 'first-edit',
            dottedId: 'B1.2',
            title: 'Your First Edit',
            prerequisites: ['B1.1'],
            references: ['B1.3'],
            docsSources: [
              'https://code.claude.com/docs/en/quickstart',
              'https://code.claude.com/docs/en/common-workflows',
            ],
            content: body(heading('Your First Edit')),
          },
          {
            id: 'review-changes',
            dottedId: 'B1.3',
            title: 'Reviewing Changes',
            prerequisites: ['B1.2'],
            docsSources: ['https://code.claude.com/docs/en/common-workflows'],
            content: body(heading('Reviewing Changes')),
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
            docsSources: ['https://code.claude.com/docs/en/slash-commands'],
            content: body(heading('Slash Commands')),
          },
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
          {
            id: 'subagents',
            dottedId: 'A1.1',
            title: 'Subagents',
            docsSources: ['https://code.claude.com/docs/en/sub-agents'],
            content: body(subagentsBody()),
          },
        ],
      },
    ],
  },
]

export const lessonPathById: Record<string, string> = {
  'B1.1': '/learn/beginner/basics/what-is-cc',
  'B1.2': '/learn/beginner/basics/first-edit',
  'B1.3': '/learn/beginner/basics/review-changes',
  'I1.1': '/learn/intermediate/workflows/slash-commands',
  'A1.1': '/learn/advanced/power/subagents',
}
