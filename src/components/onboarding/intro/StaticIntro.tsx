import type { IntroContent } from './introContent'

export function StaticIntro({ content }: { content: IntroContent }) {
  return (
    <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-5 px-6">
      <h1 className="text-center text-3xl font-bold text-accent sm:text-4xl">{content.title}</h1>
      {content.paragraphs.map((p, i) => (
        <p key={i} className="text-center text-base leading-relaxed text-accent/90">
          {p}
        </p>
      ))}
    </div>
  )
}
