import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { LanguageProvider } from '../context/LanguageContext'
import { ProgressProvider } from '../context/ProgressContext'
import { LessonPage } from './LessonPage'

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
            </Routes>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
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

test('Mark complete records completion and advances to the next lesson', async () => {
  const user = userEvent.setup()
  renderAt('/learn/beginner/basics/what-is-cc')
  await screen.findByRole('heading', { name: /what is claude code/i })

  await user.click(screen.getByRole('button', { name: /mark complete/i }))

  expect(JSON.parse(localStorage.getItem('ccc:progress')!)['what-is-cc']).toBe('completed')
  // next lesson in the stub curriculum is "Your First Edit"
  expect(await screen.findByRole('heading', { name: /your first edit/i })).toBeInTheDocument()
})

test('records the lesson path to ccc:lastLesson on visit', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  await screen.findByRole('heading', { name: /your first edit/i })
  expect(JSON.parse(localStorage.getItem('ccc:lastLesson')!)).toBe('/learn/beginner/basics/first-edit')
})
