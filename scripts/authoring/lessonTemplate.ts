import { STUB } from './paths.ts'

export function lessonTemplate(title: string, snippetId: string, promptId: string): string {
  return `# ${title}

{/* ${STUB} teaching prose */}

<Snippet id="${snippetId}" />

<TryPrompt id="${promptId}" />
`
}
