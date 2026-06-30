import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { LevelScreen } from './LevelScreen'

function renderScreen() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<LevelScreen />} />
          <Route path="/onboarding/language" element={<div>LANGUAGE STEP</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('shows the heading and the three levels', () => {
  renderScreen()
  expect(screen.getByRole('heading', { name: /your claude code level/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Beginner' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Intermediate' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument()
})

test('selecting a level persists it and advances to the language step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: 'Beginner' }))
  expect(JSON.parse(localStorage.getItem('ccc:level')!)).toBe('beginner')
  expect(await screen.findByText('LANGUAGE STEP')).toBeInTheDocument()
})

test('the chevron toggle opens one description drawer at a time', async () => {
  const user = userEvent.setup()
  renderScreen()
  const beginnerToggle = screen.getByRole('button', { name: /about the beginner level/i })
  const intermediateToggle = screen.getByRole('button', { name: /about the intermediate level/i })

  expect(beginnerToggle).toHaveAttribute('aria-expanded', 'false')
  await user.click(beginnerToggle)
  expect(beginnerToggle).toHaveAttribute('aria-expanded', 'true')
  expect(await screen.findByText(/from claude chat to claude code/i)).toBeInTheDocument()

  await user.click(intermediateToggle)
  expect(intermediateToggle).toHaveAttribute('aria-expanded', 'true')
  expect(beginnerToggle).toHaveAttribute('aria-expanded', 'false')
})
