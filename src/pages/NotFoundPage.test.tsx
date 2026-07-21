import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LevelProvider } from '../context/LevelContext'
import { NotFoundPage } from './NotFoundPage'

vi.mock('../content/curriculum', async () => await import('../test/curriculumFixture'))

function renderAt(path: string) {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={[path]}>
        <NotFoundPage />
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('shows the 404 marker and the attempted path', () => {
  renderAt('/learn/does/not/exist')
  expect(screen.getByText('404')).toBeInTheDocument()
  expect(screen.getByText('/learn/does/not/exist')).toBeInTheDocument()
})

test('a fresh visitor is sent back to the homepage', () => {
  renderAt('/nope')
  const link = screen.getByRole('link', { name: 'Back to home' })
  expect(link).toHaveAttribute('href', '/homepage')
})

test('an onboarded learner is sent back to their last lesson', () => {
  localStorage.setItem('ccd:onboarded', JSON.stringify(true))
  localStorage.setItem('ccd:lastLesson', JSON.stringify('/learn/intermediate/workflows/slash-commands'))
  renderAt('/nope')
  const link = screen.getByRole('link', { name: 'Back to your last lesson' })
  expect(link).toHaveAttribute('href', '/learn/intermediate/workflows/slash-commands')
})
