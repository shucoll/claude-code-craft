import { motion } from 'framer-motion'
import { useEffect, useRef, type AnimationEvent } from 'react'
import type { IntroContent } from './introContent'

export function Crawl({ content, onComplete }: { content: IntroContent; onComplete: () => void }) {
  const lastLineRef = useRef<HTMLHeadingElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Fire completion the moment the last line actually leaves the top of the
  // screen. The tilted/perspective crawl foreshortens the plane, so the visual
  // exit happens well before any layout-based keyframe end — observing the real
  // geometry is the only reliable way to avoid an empty tail before `done`.
  // (`onAnimationEnd` below remains a fallback and is what the jsdom tests drive,
  // since jsdom has no IntersectionObserver.)
  useEffect(() => {
    const el = lastLineRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let hasEntered = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) hasEntered = true
        else if (hasEntered) {
          onCompleteRef.current()
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: '-8% 0px 0px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'intro-crawl-scroll') onComplete()
  }

  return (
    <div className="absolute inset-0 z-10">
      <motion.p
        className="absolute left-1/2 top-[28%] w-full max-w-xl -translate-x-1/2 px-6 text-center text-base text-accent sm:text-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 5, times: [0, 0.18, 0.78, 1], ease: 'easeInOut' }}
      >
        {content.openingLine}
      </motion.p>

      <div className="intro-crawl-viewport">
        <div className="intro-crawl" data-testid="intro-crawl" onAnimationEnd={handleAnimationEnd}>
          {content.paragraphs.map((p, i) => (
            <p key={i} className="mb-5 text-center text-base leading-relaxed text-accent sm:text-xl">
              {p}
            </p>
          ))}
          <h1
            ref={lastLineRef}
            className="mb-6 text-center text-3xl font-bold tracking-wide text-accent sm:text-5xl"
          >
            {content.title}
          </h1>
        </div>
      </div>
    </div>
  )
}
