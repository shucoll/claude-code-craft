import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ProgressProvider } from '../../context/ProgressContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { AppShell } from './AppShell'

function wrap() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={['/learn/beginner/basics/first-edit']}>
            <AppShell>
              <p>lesson body</p>
            </AppShell>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
}

test('renders brand, chrome controls, sidebar, and children', () => {
  wrap()
  expect(screen.getByText('Claude Code Dojo')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /switch to (light|dark) theme/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByText('lesson body')).toBeInTheDocument()
})

test('the sidebar toggle hides and shows the nav', async () => {
  const user = userEvent.setup()
  wrap()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /collapse sidebar/i }))
  await waitFor(() =>
    expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument(),
  )
})
