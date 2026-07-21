import { EnterButton } from './EnterButton'
import { CLOSING } from './homeContent'

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-card border-2 border-ink bg-accent-soft px-6 py-12 text-center shadow-hard">
        <p className="font-mono text-xl font-semibold text-accent-foreground">{CLOSING.line}</p>
        <EnterButton />
      </div>
    </section>
  )
}
