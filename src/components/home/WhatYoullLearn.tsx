import type { ReactNode } from 'react'
import { Card } from '../ui/Card'
import { PILLARS, type PillarIcon } from './homeContent'

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const ICONS: Record<PillarIcon, ReactNode> = {
  browser: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
    </svg>
  ),
  workflows: (
    <svg {...iconProps}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M6 8.5v7M8.2 7.2l7.6 3.6M8.2 16.8l7.6-3.6" />
    </svg>
  ),
  charts: (
    <svg {...iconProps}>
      <path d="M4 4v16h16" />
      <path d="M8 16v-4M12 16v-8M16 16v-2" />
    </svg>
  ),
  milestones: (
    <svg {...iconProps}>
      <path d="M5 21V4M5 4h11l-2 3 2 3H5" />
    </svg>
  ),
}

export function WhatYoullLearn() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="mb-10 font-mono text-3xl font-semibold text-foreground">What you'll learn</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <Card key={pillar.icon} className="flex flex-col gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-control border-2 border-ink bg-accent-soft text-accent-foreground">
              {ICONS[pillar.icon]}
            </span>
            <h3 className="font-mono text-base font-semibold text-card-foreground">
              {pillar.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
