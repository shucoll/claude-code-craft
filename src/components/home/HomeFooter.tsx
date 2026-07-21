import { FOOTER } from './homeContent'

export function HomeFooter() {
  return (
    <footer className="border-t-2 border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-10">
        <span className="font-mono text-base font-semibold text-foreground">Claude Code Craft</span>
        <p className="max-w-md text-sm text-muted-foreground">{FOOTER.tagline}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{FOOTER.note}</p>
      </div>
    </footer>
  )
}
