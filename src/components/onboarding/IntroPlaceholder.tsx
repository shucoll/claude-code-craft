import { useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel } from '../../context/LevelContext'
import { resolveLandingPath } from '../../lib/landing'
import { setOnboarded } from '../../lib/onboarding'
import { Button } from '../ui/Button'
import { OnboardingLayout } from './OnboardingLayout'

export function IntroPlaceholder() {
  const navigate = useNavigate()
  const { level } = useLevel()

  const handleContinue = () => {
    setOnboarded()
    const path = resolveLandingPath(curriculum, { onboarded: true, level, lastLesson: null }) ?? '/'
    navigate(path, { replace: true })
  }

  return (
    <OnboardingLayout
      step={3}
      heading="You're all set"
      back={
        <Button variant="secondary" onClick={() => navigate('/onboarding/language')}>
          Back
        </Button>
      }
    >
      <p className="text-muted-foreground">
        A full intro to Claude Code is coming soon. For now, jump straight into your first lesson.
      </p>
      <Button onClick={handleContinue}>Continue</Button>
    </OnboardingLayout>
  )
}
