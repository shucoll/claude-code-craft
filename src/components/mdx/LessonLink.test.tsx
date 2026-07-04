import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LessonLink } from './LessonLink'

function renderLink(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

test('renders a link to the resolved lesson using its title as text', () => {
  renderLink(<LessonLink id="B1.1" />)
  const link = screen.getByRole('link', { name: /what is claude code/i })
  expect(link).toHaveAttribute('href', '/learn/beginner/basics/what-is-cc')
})

test('children override the link text', () => {
  renderLink(<LessonLink id="B1.1">start here</LessonLink>)
  expect(screen.getByRole('link', { name: 'start here' })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/what-is-cc',
  )
})

test('an unknown id renders plain text with no anchor', () => {
  renderLink(<LessonLink id="ZZ9.9">missing</LessonLink>)
  expect(screen.queryByRole('link')).toBeNull()
  expect(screen.getByText('missing')).toBeInTheDocument()
})

test('an unknown id with no children falls back to the raw id', () => {
  renderLink(<LessonLink id="ZZ9.9" />)
  expect(screen.getByText('ZZ9.9')).toBeInTheDocument()
})
