import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { ThemeToggle } from '../shell/ThemeToggle'
import { EnterButton } from './EnterButton'

export function HomeHeader() {
  // Two independent thresholds: the solid background appears on a small scroll (right as
  // the hero heading rises toward the header, so content never shows through a transparent
  // bar), while the CTA only reveals once the hero's own Get started button has scrolled
  // past - keeping it the single above-the-fold entry point.
  const [solid, setSolid] = useState(false)
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 48)
      setShowCta(y > window.innerHeight * 0.6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] border-b-2 transition-colors duration-200',
        solid ? 'border-ink bg-background/90 backdrop-blur' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-mono text-lg font-semibold text-foreground">Claude Code Craft</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div
            className={cn(
              'transition-opacity duration-200',
              showCta ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-hidden={!showCta}
          >
            <EnterButton size="sm" />
          </div>
        </div>
      </div>
    </header>
  )
}
