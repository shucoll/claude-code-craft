import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ProgressProvider } from '../../context/ProgressContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { AppShell } from './AppShell'

test('sidebar collapse still works with animation', async () => {
  const user = userEvent.setup()
  render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={['/learn/beginner/basics/first-edit']}>
            <AppShell>
              <p>body</p>
            </AppShell>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /collapse sidebar/i }))
  await waitFor(() =>
    expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument(),
  )
})
