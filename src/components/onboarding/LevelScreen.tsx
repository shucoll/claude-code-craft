import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLevel, type LevelId } from '../../context/LevelContext'
import { cn } from '../../lib/cn'
import { OnboardingLayout } from './OnboardingLayout'

interface LevelOption {
  id: LevelId
  label: string
  description: string
  comingSoon?: boolean
}

const LEVELS: LevelOption[] = [
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
      "You've used Claude Code with basic prompts but haven't tapped its full potential. Learn concepts like skills, hooks, and MCP servers — how and when to use them — and complete a project that puts them to work.",
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: "Comfortable with Claude Code day-to-day and ready to become a power user.",
    comingSoon: true,
  },
]

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function LevelScreen() {
  const navigate = useNavigate()
  const { setLevel } = useLevel()
  const [openId, setOpenId] = useState<LevelId | null>(null)
  const reduce = useReducedMotion()

  const select = (id: LevelId) => {
    setLevel(id)
    navigate('/onboarding/language')
  }

  return (
    <OnboardingLayout step={1} heading="Your Claude Code Level">
      {LEVELS.map((lvl) => {
        const open = openId === lvl.id
        return (
          <div
            key={lvl.id}
            className={cn(
              'rounded-card border-2 border-ink bg-card shadow-hard',
              lvl.comingSoon && 'opacity-60',
            )}
          >
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => select(lvl.id)}
                disabled={lvl.comingSoon}
                className={cn(
                  'flex min-h-[44px] flex-1 items-center px-5 py-4 text-left font-mono text-lg font-semibold text-card-foreground',
                  lvl.comingSoon
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:bg-muted',
                )}
              >
                {lvl.label}
                {lvl.comingSoon && (
                  <>
                    {' '}
                    <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
                      (Coming Soon)
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                aria-label={`About the ${lvl.label} level`}
                aria-expanded={open}
                aria-controls={`level-desc-${lvl.id}`}
                onClick={() => setOpenId((prev) => (prev === lvl.id ? null : lvl.id))}
                className="flex w-12 shrink-0 cursor-pointer items-center justify-center border-l-2 border-ink text-muted-foreground hover:bg-muted"
              >
                <Chevron open={open} />
              </button>
            </div>
            {open && (
              <motion.div
                id={`level-desc-${lvl.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.15 }}
                className="border-t-2 border-border"
              >
                <p className="px-5 py-4 text-sm text-muted-foreground">{lvl.description}</p>
              </motion.div>
            )}
          </div>
        )
      })}

      <p className="text-sm text-muted-foreground">
        Every level's lessons are open to everyone — your pick just sets where you start. You can
        switch levels anytime.
      </p>
    </OnboardingLayout>
  )
}
