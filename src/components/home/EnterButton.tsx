import { Link } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel } from '../../context/LevelContext'
import { cn } from '../../lib/cn'
import { resolveLandingPath } from '../../lib/landing'
import { getLastLesson, isOnboarded } from '../../lib/onboarding'

type Size = 'sm' | 'md'

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
}

// The single entry point into the platform, shared by the header, hero, and closing
// CTA. Destination reuses the landing resolver (onboarding for newcomers, the last/first
// lesson for returners); the label adapts to match. Rendered as a Link so it stays a
// real navigation target, styled to match Button's chunky primary variant.
export function EnterButton({
  size = 'md',
  className,
}: {
  size?: Size
  className?: string
}) {
  const { level } = useLevel()
  const onboarded = isOnboarded()
  const target =
    resolveLandingPath(curriculum, { onboarded, level, lastLesson: getLastLesson() }) ??
    '/onboarding'

  return (
    <Link
      to={target}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control',
        'font-sans font-bold select-none',
        'border-2 border-ink bg-primary text-primary-foreground shadow-hard',
        'transition-[transform,box-shadow,background-color] duration-150 ease-[var(--ease-out-soft)]',
        'hover:bg-primary-hover hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
        'active:shadow-hard-sm active:translate-x-1 active:translate-y-1',
        sizes[size],
        className,
      )}
    >
      {onboarded ? 'Continue learning' : 'Get started'}
    </Link>
  )
}
