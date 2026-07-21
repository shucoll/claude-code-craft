import { cn } from '../../lib/cn'

/**
 * The chunky "chip" brand mark: a coral tile (ink border + hard offset shadow,
 * matching the Card/Badge primitives) framing a command-line prompt `>_`.
 * Decorative by default — pair it with the wordmark for the accessible name.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn('h-7 w-7 shrink-0', className)}
    >
      {/* hard offset shadow */}
      <rect x="13" y="11" width="44" height="44" rx="12" className="fill-ink" />
      {/* tile */}
      <rect
        x="8"
        y="6"
        width="44"
        height="44"
        rx="12"
        strokeWidth="3"
        className="fill-primary stroke-ink"
      />
      {/* prompt: chevron + cursor */}
      <polyline
        points="20,18 29,28 20,38"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <rect x="31" y="34" width="11" height="5" rx="2.5" className="fill-primary-foreground" />
    </svg>
  )
}

/** Full brand lockup: chip mark + "Claude Code Dojo" wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-mono text-lg font-bold">Claude Code Dojo</span>
    </div>
  )
}
