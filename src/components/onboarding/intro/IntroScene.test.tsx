import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../../context/LevelContext'
import { INTRO_CONTENT } from './introContent'
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

test('renders the scene as a self-contained dark surface', () => {
  const { container } = renderScene()
  expect(container.querySelector('main')).toHaveClass('dark')
})

test('plays the crawl with Skip and Skip & Continue controls', () => {
  renderScene()
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /skip & continue/i })).toBeInTheDocument()
})

test('Skip & Continue completes onboarding and enters the app', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: /skip & continue/i }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})

test('Skip fast-forwards to the end state without leaving the intro', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: 'Skip' }))
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /skip & continue/i })).not.toBeInTheDocument()
  expect(screen.queryByText('LESSON PAGE')).not.toBeInTheDocument()
  expect(localStorage.getItem('ccc:onboarded')).toBeNull()
})

test('the crawl finishing collapses the controls to a single Continue', () => {
  renderScene()
  fireEvent.animationEnd(screen.getByTestId('intro-crawl'), { animationName: 'intro-crawl-scroll' })
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
})

test('Continue in the end state completes onboarding and enters the app', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: 'Skip' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})
