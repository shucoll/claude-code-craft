import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { RootRedirect } from './RootRedirect'

function PathProbe() {
  return <div data-testid="path">{useLocation().pathname}</div>
}

function renderRoot() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/']}>
        <PathProbe />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/onboarding" element={<div>ONBOARDING</div>} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('a fresh visitor is sent to onboarding', () => {
  renderRoot()
  expect(screen.getByTestId('path')).toHaveTextContent('/onboarding')
})

test('an onboarded visitor resumes their last lesson', () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  localStorage.setItem('ccc:lastLesson', JSON.stringify('/learn/intermediate/workflows/slash-commands'))
  renderRoot()
  expect(screen.getByTestId('path')).toHaveTextContent('/learn/intermediate/workflows/slash-commands')
})
