import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { GitHubLink } from './GitHubLink'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { ProgressBar } from './ProgressBar'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

function PanelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.22

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-4 border-b-2 border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <PanelIcon />
          </Button>
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar className="hidden sm:flex" />
          <LanguageSwitcher />
          <GitHubLink />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 overflow-y-auto overflow-x-hidden border-r-2 border-border bg-card/40 z-[var(--z-sidebar)]"
            >
              <div className="w-72">
                <Sidebar />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
