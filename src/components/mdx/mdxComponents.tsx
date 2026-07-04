import type { MDXComponents } from 'mdx/types'
import { cn } from '../../lib/cn'
import { ChartEmbed } from '../charts/ChartEmbed'
import { LessonLink } from './LessonLink'
import { Snippet } from './Snippet'
import { TryPrompt } from './TryPrompt'
import { WhenLang } from './WhenLang'

export const mdxComponents = {
  Snippet,
  TryPrompt,
  WhenLang,
  ChartEmbed,
  LessonLink,
  h1: (props) => <h1 className="mt-0 mb-4 font-mono text-3xl font-bold" {...props} />,
  h2: (props) => <h2 className="mt-8 mb-3 font-mono text-2xl font-semibold" {...props} />,
  h3: (props) => <h3 className="mt-6 mb-2 font-mono text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4 leading-relaxed text-foreground" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-1 pl-6" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-1 pl-6" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a className="text-link underline underline-offset-2 hover:text-primary" {...props} />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn('rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]', className)}
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-4 border-l-4 border-accent bg-muted/50 py-2 pl-4 text-muted-foreground"
      {...props}
    />
  ),
} satisfies MDXComponents
