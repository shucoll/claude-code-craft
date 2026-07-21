import { render, screen } from '@testing-library/react'
import App from './App'

test('a fresh visitor lands on the homepage (no shell)', () => {
  render(<App />)
  // The homepage greets first-time visitors before onboarding; its CTA leads in.
  const ctas = screen.getAllByRole('link', { name: /get started/i })
  expect(ctas.length).toBeGreaterThanOrEqual(1)
  expect(ctas[0]).toHaveAttribute('href', '/onboarding')
  // The app chrome is absent until onboarding completes.
  expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument()
})

test('an onboarded visitor sees the app shell and chrome', async () => {
  localStorage.setItem('ccd:onboarded', JSON.stringify(true))
  render(<App />)
  expect(await screen.findByText('Claude Code Dojo')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
})
