import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../../context/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'

function wrap(ui: ReactNode) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('lists the available languages and reflects the active one', () => {
  wrap(<LanguageSwitcher />)
  const select = screen.getByRole('combobox', { name: /language/i }) as HTMLSelectElement
  expect(select.value).toBe('javascript')
  expect(screen.getByRole('option', { name: 'Python' })).toBeInTheDocument()
})

test('switching the language persists to ccc:lang', async () => {
  const user = userEvent.setup()
  wrap(<LanguageSwitcher />)
  await user.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'python')
  expect(JSON.parse(localStorage.getItem('ccc:lang')!)).toBe('python')
})
