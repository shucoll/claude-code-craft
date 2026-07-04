import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { LessonRefLinks } from './LessonRefLinks'

function renderRefs(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

test('inline variant renders the label and one link per id', () => {
  renderRefs(<LessonRefLinks label="Prerequisites" ids={['B1.1', 'B1.2']} variant="inline" />)
  expect(screen.getByText('Prerequisites:')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /what is claude code/i })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/what-is-cc',
  )
  expect(screen.getByRole('link', { name: /your first edit/i })).toBeInTheDocument()
})

test('list variant renders a labelled nav with a link per id', () => {
  renderRefs(<LessonRefLinks label="Where next" ids={['B1.3']} variant="list" />)
  expect(screen.getByRole('navigation', { name: 'Where next' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /reviewing changes/i })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/review-changes',
  )
})

test('renders nothing when ids is empty', () => {
  const { container } = renderRefs(<LessonRefLinks label="Prerequisites" ids={[]} variant="inline" />)
  expect(container.textContent).toBe('')
})
