import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the brand header and theme toggle', () => {
  render(<App />)
  expect(screen.getByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
})
