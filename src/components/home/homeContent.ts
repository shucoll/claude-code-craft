// Copy and structured data for the homepage sections. Icons live in the section
// components (this is a .ts file); entries below pair with them by `icon` key / order.

export const HERO = {
  headline: 'Master Claude Code, lesson by lesson.',
  subhead:
    'An interactive course that takes you from your first edit to shipping real projects with Claude Code.',
  reassurance: 'No signup. Runs in your browser.',
} as const

export type PillarIcon = 'browser' | 'workflows' | 'charts' | 'milestones'

export interface Pillar {
  icon: PillarIcon
  title: string
  body: string
}

export const PILLARS: Pillar[] = [
  {
    icon: 'browser',
    title: 'Hands-on in your browser',
    body: 'Learn by doing, right here. Nothing to install before your first lesson, and you pick the language the examples speak.',
  },
  {
    icon: 'workflows',
    title: 'Real workflows',
    body: 'Skills, hooks, and MCP servers, plus the commands and habits that make Claude Code fast. What they are, and when to reach for each.',
  },
  {
    icon: 'charts',
    title: 'Interactive charts and diagrams',
    body: 'Concepts click when you can step through them. Flowcharts and card-flow diagrams walk you through decisions and loops.',
  },
  {
    icon: 'milestones',
    title: 'Project-based milestones',
    body: 'Every level ends in a real project, so you finish with something you built, not just notes you took.',
  },
]

export interface Step {
  title: string
  body: string
}

export const STEPS: Step[] = [
  { title: 'Choose your level', body: 'Beginner, Intermediate, or Advanced. Switch anytime.' },
  { title: 'Pick your language', body: 'Examples adapt to the language you work in.' },
  { title: 'Learn by doing', body: 'Work through interactive lessons at your own pace.' },
]

export const CLOSING = {
  line: 'Ready? Pick your level and start.',
} as const

export const FOOTER = {
  tagline: 'An interactive course for getting the most out of Claude Code.',
  note: 'Built with Claude Code and',
} as const
