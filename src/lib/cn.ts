export type ClassValue = string | number | null | undefined | false

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
