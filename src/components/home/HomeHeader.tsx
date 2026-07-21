import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { ThemeToggle } from '../shell/ThemeToggle'
import { EnterButton } from './EnterButton'

export function HomeHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Solid header + CTA appear once the hero has largely scrolled away, so the hero's
    // own CTA stays the single above-the-fold entry point.
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] transition-colors duration-200',
        scrolled ? 'border-b-2 border-ink bg-background/90 backdrop-blur' : 'border-b-2 border-transparent',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-mono text-lg font-semibold text-foreground">Claude Code Craft</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div
            className={cn(
              'transition-opacity duration-200',
              scrolled ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-hidden={!scrolled}
          >
            <EnterButton size="sm" />
          </div>
        </div>
      </div>
    </header>
  )
}
