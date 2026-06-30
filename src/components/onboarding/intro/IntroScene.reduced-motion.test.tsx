import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../../context/LevelContext'
import { INTRO_CONTENT } from './introContent'

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useReducedMotion: () => true }
})

import { IntroScene } from './IntroScene'

function renderScene() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding/intro']}>
        <Routes>
          <Route path="/onboarding/intro" element={<IntroScene />} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('reduced motion shows static content and a single Continue (no Skip, no crawl)', () => {
  renderScene()
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  expect(screen.getByText(INTRO_CONTENT.paragraphs[0])).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
  expect(screen.queryByTestId('intro-crawl')).not.toBeInTheDocument()
})

test('reduced-motion Continue completes onboarding and enters the app', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})
