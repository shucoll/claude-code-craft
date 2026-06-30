import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { curriculum } from '../../../content/curriculum'
import { useLevel } from '../../../context/LevelContext'
import { resolveLandingPath } from '../../../lib/landing'
import { setOnboarded } from '../../../lib/onboarding'
import { Button } from '../../ui/Button'
import { Crawl } from './Crawl'
import { Starfield } from './Starfield'
import { StaticIntro } from './StaticIntro'
import { INTRO_CONTENT } from './introContent'
import './intro.css'

type Phase = 'playing' | 'done'

export function IntroScene() {
  const navigate = useNavigate()
  const { level } = useLevel()
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(reduce ? 'done' : 'playing')
  const continueRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (phase === 'done') continueRef.current?.focus()
  }, [phase])

  const handleContinue = () => {
    setOnboarded()
    const path = resolveLandingPath(curriculum, { onboarded: true, level, lastLesson: null }) ?? '/'
    navigate(path, { replace: true })
  }

  return (
    // `dark` and `bg-background` intentionally live on the same element — this
    // scene is a self-contained dark surface; do not hoist `dark` to a wrapper.
    <motion.main
      className="dark fixed inset-0 z-[var(--z-modal)] flex flex-col overflow-hidden bg-background"
      initial={{ opacity: reduce ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }}
    >
      <Starfield />

      <div className="relative flex flex-1 items-center justify-center">
        {phase === 'playing' ? (
          <Crawl content={INTRO_CONTENT} onComplete={() => setPhase('done')} />
        ) : (
          <motion.div
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
          >
            <StaticIntro content={INTRO_CONTENT} />
          </motion.div>
        )}
      </div>

      <div className="relative z-20 flex justify-center gap-3 p-6">
        {phase === 'playing' ? (
          <>
            <Button variant="ghost" onClick={() => setPhase('done')}>
              Skip
            </Button>
            <Button variant="secondary" onClick={handleContinue}>
              Skip &amp; Continue
            </Button>
          </>
        ) : (
          <Button ref={continueRef} onClick={handleContinue}>Continue</Button>
        )}
      </div>
    </motion.main>
  )
}
