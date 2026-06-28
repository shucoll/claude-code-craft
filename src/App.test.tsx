import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the app title and theme toggle', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /claude code craft/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
})
