import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'brand' | 'success'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground',
  brand: 'bg-accent-soft text-accent-foreground',
  success: 'bg-success-soft text-success-on-soft',
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1 border-2 border-ink rounded-pill shadow-hard-sm',
        'px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
