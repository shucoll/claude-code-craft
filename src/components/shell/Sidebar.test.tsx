import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../../context/ProgressContext'
import { Sidebar } from './Sidebar'

function wrap(ui: ReactNode, path = '/learn/beginner/basics/first-edit') {
  return render(
    <ProgressProvider>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </ProgressProvider>,
  )
}

test('renders the curriculum hierarchy as navigation', () => {
  wrap(<Sidebar />)
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByText('Beginner')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /your first edit/i })).toBeInTheDocument()
})

test('marks the active route lesson with the current glyph', () => {
  wrap(<Sidebar />)
  const activeLink = screen.getByRole('link', { name: /your first edit/i })
  expect(activeLink.querySelector('[aria-label="Current lesson"]')).toBeInTheDocument()
})

test('shows the completed glyph for completed lessons', () => {
  localStorage.setItem('ccc:progress', JSON.stringify({ 'what-is-cc': 'completed' }))
  wrap(<Sidebar />)
  const completedLink = screen.getByRole('link', { name: /what is claude code/i })
  expect(completedLink.querySelector('[aria-label="Completed"]')).toBeInTheDocument()
})
