import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { LanguageScreen } from './LanguageScreen'

function renderScreen() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/onboarding/language']}>
        <Routes>
          <Route path="/onboarding" element={<div>LEVEL STEP</div>} />
          <Route path="/onboarding/language" element={<LanguageScreen />} />
          <Route path="/onboarding/intro" element={<div>INTRO STEP</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders one option per language and the fallback note', () => {
  renderScreen()
  expect(screen.getByRole('heading', { name: /preferred programming language/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'JavaScript' })).toBeInTheDocument()
  expect(screen.getByText(/don't see your programming language/i)).toBeInTheDocument()
})

test('selecting a language persists it and advances to the intro step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: 'Python' }))
  expect(JSON.parse(localStorage.getItem('ccc:lang')!)).toBe('python')
  expect(await screen.findByText('INTRO STEP')).toBeInTheDocument()
})

test('Back returns to the level step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: /back/i }))
  expect(await screen.findByText('LEVEL STEP')).toBeInTheDocument()
})
