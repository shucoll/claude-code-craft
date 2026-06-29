import { render, screen } from '@testing-library/react'
import { OnboardingLayout } from './OnboardingLayout'

test('renders the heading and step indicator', () => {
  render(
    <OnboardingLayout step={2} heading="Pick one">
      <p>body</p>
    </OnboardingLayout>,
  )
  expect(screen.getByRole('heading', { name: 'Pick one' })).toBeInTheDocument()
  expect(screen.getByLabelText('Step 2 of 3')).toBeInTheDocument()
  expect(screen.getByText('body')).toBeInTheDocument()
})

test('renders the back slot only when provided', () => {
  const { rerender } = render(
    <OnboardingLayout step={1} heading="H">
      <p>x</p>
    </OnboardingLayout>,
  )
  expect(screen.queryByText('GO BACK')).not.toBeInTheDocument()

  rerender(
    <OnboardingLayout step={1} heading="H" back={<button>GO BACK</button>}>
      <p>x</p>
    </OnboardingLayout>,
  )
  expect(screen.getByText('GO BACK')).toBeInTheDocument()
})
