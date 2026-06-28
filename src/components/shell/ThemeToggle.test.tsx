import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

function setup() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

test('renders an accessible toggle button', () => {
  setup()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
})

test('clicking toggles the dark class on html', async () => {
  const user = userEvent.setup()
  setup()
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  await user.click(screen.getByRole('button', { name: /toggle theme/i }))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
