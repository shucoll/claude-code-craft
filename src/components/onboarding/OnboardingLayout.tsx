import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const TOTAL_STEPS = 3

interface OnboardingLayoutProps {
  step: 1 | 2 | 3
  heading: string
  children: ReactNode
  back?: ReactNode
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={cn(
            'h-2 rounded-pill transition-all duration-150',
            n === step ? 'w-8 bg-primary' : 'w-2 bg-muted',
          )}
        />
      ))}
    </div>
  )
}

export function OnboardingLayout({ step, heading, children, back }: OnboardingLayoutProps) {
  const reduce = useReducedMotion()
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex w-full max-w-lg flex-col gap-8"
      >
        <StepIndicator step={step} />
        <h1 className="text-3xl text-foreground">{heading}</h1>
        <div className="flex flex-col gap-4">{children}</div>
        {back && <div className="pt-2">{back}</div>}
      </motion.div>
    </main>
  )
}
