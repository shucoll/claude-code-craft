export const LEVEL_BY_LETTER: Record<string, string> = {
  B: 'beginner',
  I: 'intermediate',
  A: 'advanced',
}

export function levelOf(dottedId: string): string | undefined {
  return LEVEL_BY_LETTER[dottedId[0]]
}

export function moduleCodeOf(dottedId: string): string {
  return dottedId.split('.')[0]
}
