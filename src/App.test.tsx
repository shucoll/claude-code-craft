import { render, screen } from '@testing-library/react'
import App from './App'

test('a fresh visitor lands on the onboarding level screen (no shell)', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /your claude code level/i })).toBeInTheDocument()
  // The app chrome is absent until onboarding completes.
  expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument()
})

test('an onboarded visitor sees the app shell and chrome', async () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  render(<App />)
  expect(await screen.findByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
})
