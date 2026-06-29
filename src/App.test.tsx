import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the brand header, sidebar, and chrome controls', () => {
  render(<App />)
  expect(screen.getByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
})
