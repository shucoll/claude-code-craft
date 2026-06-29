import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { IntroPlaceholder } from './IntroPlaceholder'

function renderScreen() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding/intro']}>
        <Routes>
          <Route path="/onboarding/language" element={<div>LANGUAGE STEP</div>} />
          <Route path="/onboarding/intro" element={<IntroPlaceholder />} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('Continue marks onboarding complete and enters the app', async () => {
  const user = userEvent.setup()
  localStorage.setItem('ccc:level', JSON.stringify('intermediate'))
  renderScreen()
  await user.click(screen.getByRole('button', { name: /continue/i }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})

test('Back returns to the language step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: /back/i }))
  expect(await screen.findByText('LANGUAGE STEP')).toBeInTheDocument()
})
