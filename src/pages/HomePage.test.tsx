import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LevelProvider } from '../context/LevelContext'
import { HomePage } from './HomePage'

vi.mock('../content/curriculum', async () => await import('../test/curriculumFixture'))

function renderHome() {
  return render(
    <LevelProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </LevelProvider>,
  )
}

test("a fresh visitor's CTA points at onboarding", () => {
  renderHome()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/onboarding')
})

test("an onboarded visitor's CTA resumes their last lesson", () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  localStorage.setItem('ccc:lastLesson', JSON.stringify('/learn/intermediate/workflows/slash-commands'))
  renderHome()
  expect(screen.getByRole('link')).toHaveAttribute(
    'href',
    '/learn/intermediate/workflows/slash-commands',
  )
})
