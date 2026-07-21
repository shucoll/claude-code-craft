import type { ReactNode } from 'react'
import { Card } from '../ui/Card'
import { GITHUB_REPO_URL } from '../shell/GitHubLink'
import { TRUST } from './homeContent'

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

function DocsIcon(): ReactNode {
  return (
    <svg {...iconProps}>
      <path d="M4 4a2 2 0 0 1 2-2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M14 2v4h4M8 12h8M8 16h5" />
    </svg>
  )
}

function OpenSourceIcon(): ReactNode {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v6M9 14.5 5 20M15 14.5 19 20" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

export function TrustBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="mb-10 font-mono text-3xl font-semibold text-foreground">{TRUST.heading}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-control border-2 border-ink bg-accent-soft text-accent-foreground">
            <DocsIcon />
          </span>
          <h3 className="font-mono text-base font-semibold text-card-foreground">
            {TRUST.docsTitle}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{TRUST.docsBody}</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-control border-2 border-ink bg-accent-soft text-accent-foreground">
            <OpenSourceIcon />
          </span>
          <h3 className="font-mono text-base font-semibold text-card-foreground">
            {TRUST.openTitle}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{TRUST.openBody}</p>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex w-fit items-center gap-1.5 font-mono text-sm text-link underline underline-offset-2 hover:text-primary"
          >
            View on GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </Card>
      </div>
    </section>
  )
}
