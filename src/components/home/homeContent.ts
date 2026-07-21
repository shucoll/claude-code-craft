// Copy and structured data for the homepage sections. Icons live in the section
// components (this is a .ts file); entries below pair with them by `icon` key / order.

export const HERO = {
  headline: 'Master Claude Code, lesson by lesson.',
  subhead:
    'An interactive course that takes you from your first edit to shipping real projects with Claude Code.',
  reassurance: 'Free and open source. No signup.',
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
    title: 'Learn here, build on your machine',
    body: 'Read interactive lessons with diagrams and examples in the language you work in, nothing to install to start. When you are ready for real work, you set up Claude Code on your own machine and the lessons get you there.',
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

export const TRUST = {
  heading: 'Verified and open source',
  docsTitle: 'Grounded in the official docs',
  docsBody:
    "Every lesson is built from Anthropic's official Claude Code documentation and links the exact pages it draws on. Claude Code moves fast, so doc changes are tracked and lessons kept current.",
  openTitle: 'Free and open source',
  openBody:
    'No accounts, no paywalls. Read the source, open an issue, or send a fix on GitHub.',
} as const

export const FOOTER = {
  tagline: 'An interactive course for getting the most out of Claude Code.',
  note: 'Built with Claude Code and',
  disclaimer:
    'Not affiliated with or endorsed by Anthropic. Claude and Claude Code are trademarks of Anthropic, PBC.',
} as const
