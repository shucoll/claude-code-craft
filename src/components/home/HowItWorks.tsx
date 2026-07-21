import { STEPS } from './homeContent'

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="mb-10 font-mono text-3xl font-semibold text-foreground">How it works</h2>

      <ol className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-control border-2 border-ink bg-primary font-mono text-lg font-bold text-primary-foreground shadow-hard">
              {i + 1}
            </span>
            <h3 className="font-mono text-base font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
