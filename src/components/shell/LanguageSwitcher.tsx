import { cn } from '../../lib/cn'
import { LANGUAGES } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <select
        aria-label="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={cn(
          'h-9 cursor-pointer appearance-none rounded-control border-2 border-ink bg-card pl-3 pr-8',
          'font-mono text-sm font-medium text-card-foreground shadow-hard-sm',
          'transition-[box-shadow,transform] duration-150 ease-[var(--ease-out-soft)]',
          'hover:-translate-x-px hover:-translate-y-px hover:shadow-hard',
        )}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </div>
  )
}
