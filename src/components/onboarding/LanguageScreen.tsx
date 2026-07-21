import { useNavigate } from 'react-router-dom'
import { LANGUAGES } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'
import { Button } from '../ui/Button'
import { OnboardingLayout } from './OnboardingLayout'

export function LanguageScreen() {
  const navigate = useNavigate()
  const { setLanguage } = useLanguage()

  const select = (id: string) => {
    setLanguage(id)
    navigate('/onboarding/intro')
  }

  return (
    <OnboardingLayout
      step={2}
      heading="Preferred Programming Language"
      back={
        <Button variant="secondary" onClick={() => navigate('/onboarding')}>
          Back
        </Button>
      }
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => select(lang.id)}
          className="flex min-h-[44px] cursor-pointer items-center rounded-card border-2 border-ink bg-card px-5 py-4 text-left font-mono text-lg font-semibold text-card-foreground shadow-hard hover:bg-muted"
        >
          {lang.label}
        </button>
      ))}

      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Don't see your programming language?</span>{' '}
        The course is language-independent — the concepts and prompts apply to any language. Your
        selection only flavors the code-snippet examples, and sets the language for the guided
        project at the end of each level.
      </p>
    </OnboardingLayout>
  )
}
