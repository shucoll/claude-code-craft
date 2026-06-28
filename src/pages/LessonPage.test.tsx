import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../context/LanguageContext'
import { ProgressProvider } from '../context/ProgressContext'
import { LessonPage } from './LessonPage'

function renderAt(path: string) {
  return render(
    <LanguageProvider>
      <ProgressProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>
    </LanguageProvider>,
  )
}

test('renders the lesson MDX content for the route', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  expect(await screen.findByRole('heading', { name: /your first edit/i })).toBeInTheDocument()
})

test('marks the lesson visited on mount', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  await screen.findByRole('heading', { name: /your first edit/i })
  expect(JSON.parse(localStorage.getItem('ccc:progress')!)['first-edit']).toBe('visited')
})
