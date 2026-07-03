import type { ComponentType } from 'react'

export type LessonType = 'core' | 'resolver' | 'workflow' | 'checkpoint' | 'milestone'
export type Volatility = 'stable' | 'evolving' | 'volatile'
export type InteractiveKind = 'diagram' | 'decision-tree' | 'simulator' | 'quiz'

export interface InteractiveRef {
  kind: InteractiveKind
  spec: string
}

export interface Lesson {
  /** URL segment + progress key (human slug, e.g. "what-is-cc"). */
  id: string
  title: string
  /**
   * Canonical curriculum code (e.g. "B1.1"); cross-reference + lessonPathById key.
   * Optional in the interface so existing hand-built test fixtures keep compiling;
   * the generator always populates it.
   */
  dottedId?: string
  type?: LessonType
  order?: number
  estimatedMinutes?: number
  volatility?: Volatility
  verifiedAgainstDocsAt?: string
  prerequisites?: string[]
  teaches?: string[]
  references?: string[]
  docsSources?: string[]
  interactive?: InteractiveRef[]
  content: () => Promise<{ default: ComponentType }>
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Level {
  id: string
  title: string
  modules: Module[]
}
