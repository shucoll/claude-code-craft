import { motion, useReducedMotion } from 'framer-motion'
import { EnterButton } from './EnterButton'
import { FauxTerminal } from './FauxTerminal'
import { HERO } from './homeContent'

export function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-start gap-6"
      >
        <h1 className="font-mono text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          {HERO.headline}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">{HERO.subhead}</p>
        <div className="flex flex-col items-start gap-3 pt-2">
          <EnterButton />
          <span className="font-mono text-xs text-muted-foreground">{HERO.reassurance}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <FauxTerminal />
      </motion.div>
    </section>
  )
}
