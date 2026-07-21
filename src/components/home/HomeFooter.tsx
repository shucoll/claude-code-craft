import { FOOTER } from './homeContent'

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block h-3.5 w-3.5 fill-destructive"
      role="img"
      aria-label="love"
    >
      <path d="M12 21s-7.5-4.9-10-9.2C.6 9.2 1.6 5.8 4.7 5.1 6.7 4.6 8.7 5.5 12 8.6c3.3-3.1 5.3-4 7.3-3.5 3.1.7 4.1 4.1 2.7 6.7C19.5 16.1 12 21 12 21z" />
    </svg>
  )
}

export function HomeFooter() {
  return (
    <footer className="border-t-2 border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-10">
        <span className="font-mono text-base font-semibold text-foreground">Claude Code Dojo</span>
        <p className="max-w-md text-sm text-muted-foreground">{FOOTER.tagline}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          {FOOTER.note} <HeartIcon />
        </p>
        <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
          {FOOTER.disclaimer}
        </p>
      </div>
    </footer>
  )
}
