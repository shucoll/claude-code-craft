import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '../../lib/cn'

// A static, on-brand mock of a Claude Code session for the hero. Purely decorative:
// hidden from assistive tech (the hero heading/subhead carry the meaning). Lines fade
// in with a gentle stagger; reduced-motion renders them settled immediately.

type Line =
  | { kind: 'prompt'; text: string }
  | { kind: 'action'; text: string }
  | { kind: 'done'; text: string }

const LINES: Line[] = [
  { kind: 'prompt', text: 'add a dark-mode toggle to the header' },
  { kind: 'action', text: 'Edited theme.ts' },
  { kind: 'action', text: 'Edited Header.tsx' },
  { kind: 'done', text: 'Done - 2 files changed' },
]

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const line: Variants = {
  hidden: { opacity: 0, y: 4 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
}

function Dot({ className }: { className: string }) {
  return <span className={cn('h-3 w-3 rounded-full border-2 border-ink', className)} />
}

export function FauxTerminal({ className }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className={cn(
        'w-full overflow-hidden rounded-card border-2 border-ink bg-card shadow-hard',
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-3">
        <Dot className="bg-destructive" />
        <Dot className="bg-primary" />
        <Dot className="bg-success" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">claude · ~/project</span>
      </div>

      {/* Body */}
      <motion.div
        variants={container}
        initial={reduce ? 'shown' : 'hidden'}
        animate="shown"
        className="flex flex-col gap-2 p-4 font-mono text-sm leading-relaxed"
      >
        {LINES.map((l, i) => (
          <motion.div key={i} variants={line} className="flex items-start gap-2">
            {l.kind === 'prompt' && (
              <>
                <span className="select-none text-primary">{'>'}</span>
                <span className="text-card-foreground">{l.text}</span>
              </>
            )}
            {l.kind === 'action' && (
              <>
                <span className="select-none text-primary">●</span>
                <span className="text-muted-foreground">{l.text}</span>
              </>
            )}
            {l.kind === 'done' && (
              <>
                <span className="select-none text-success">●</span>
                <span className="text-card-foreground">{l.text}</span>
              </>
            )}
          </motion.div>
        ))}

        {/* Cursor */}
        <motion.span
          variants={line}
          className="mt-1 inline-block h-4 w-2 bg-primary"
          animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
          transition={reduce ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </div>
  )
}
