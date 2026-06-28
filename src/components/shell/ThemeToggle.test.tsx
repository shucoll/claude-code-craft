import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('renders an accessible toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /switch to (light|dark) theme/i })).toBeInTheDocument()
  })

  it('toggles the document theme class on click', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const startedDark = document.documentElement.classList.contains('dark')
    await userEvent.click(screen.getByRole('button'))
    expect(document.documentElement.classList.contains('dark')).toBe(!startedDark)
  })
})
