import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { EnterButton } from './EnterButton'

vi.mock('../../content/curriculum', async () => await import('../../test/curriculumFixture'))

function renderButton() {
  return render(
    <LevelProvider>
      <MemoryRouter>
        <EnterButton />
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('a fresh visitor sees "Get started" pointing at onboarding', () => {
  renderButton()
  const link = screen.getByRole('link', { name: /get started/i })
  expect(link).toHaveAttribute('href', '/onboarding')
})

test('an onboarded visitor sees "Continue learning" pointing at their lesson', () => {
  localStorage.setItem('ccd:onboarded', JSON.stringify(true))
  localStorage.setItem('ccd:lastLesson', JSON.stringify('/learn/intermediate/workflows/slash-commands'))
  renderButton()
  const link = screen.getByRole('link', { name: /continue learning/i })
  expect(link).toHaveAttribute('href', '/learn/intermediate/workflows/slash-commands')
})
