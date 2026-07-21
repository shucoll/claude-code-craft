import { cn } from '../../lib/cn'

export const GITHUB_REPO_URL = 'https://github.com/shucoll/claude-code-dojo'

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5A10.5 10.5 0 0 0 8.68 22c.53.1.72-.23.72-.51v-1.8c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.54-1.17-1.54-.95-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.67-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.09-2.82-.11-.27-.47-1.35.1-2.8 0 0 .89-.29 2.9 1.07a10.1 10.1 0 0 1 5.28 0c2-1.36 2.89-1.07 2.89-1.07.58 1.45.21 2.53.11 2.8.68.74 1.09 1.67 1.09 2.82 0 4.02-2.46 4.9-4.8 5.16.38.33.71.97.71 1.96v2.9c0 .29.19.62.73.51A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  )
}

/**
 * Anchor styled to match the ghost/icon Button, so it sits cleanly alongside
 * ThemeToggle in the headers. Button is button-only (no asChild), so we reuse
 * the token classes directly on an <a>.
 */
export function GitHubLink({ className }: { className?: string }) {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View source on GitHub"
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-control',
        'border-2 border-transparent bg-transparent text-foreground',
        'transition-colors duration-150 ease-[var(--ease-out-soft)] hover:bg-muted',
        className,
      )}
    >
      <GitHubIcon />
    </a>
  )
}
