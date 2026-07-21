import type { LevelId } from '../context/LevelContext'

export interface LevelMeta {
  id: LevelId
  label: string
  /** Canonical, onboarding-length description of the level. */
  description: string
  /** True while the level's content is not yet available. */
  comingSoon?: boolean
}

/**
 * Single source of truth for the level id/label/description shown in onboarding
 * (LevelScreen) and on the homepage (Pathways). Keep descriptions here so the two
 * surfaces never drift.
 */
export const LEVELS_META: LevelMeta[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description:
      'For moving from Claude chat to Claude Code. Learn what it is, how to install it, basic workflows and commands, and complete your first project with Claude Code.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description:
      "You've used Claude Code with basic prompts but haven't tapped its full potential. Learn concepts like skills, hooks, and MCP servers - how and when to use them, and complete a project that puts them to work.",
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Comfortable with Claude Code day-to-day and ready to become a power user.',
    comingSoon: true,
  },
]
