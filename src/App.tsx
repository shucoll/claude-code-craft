import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/shell/AppShell'
import { curriculum } from './content/curriculum'
import { LanguageProvider } from './context/LanguageContext'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { firstLesson } from './lib/curriculumNav'
import { LessonPage } from './pages/LessonPage'

function RootRedirect() {
  const first = firstLesson(curriculum)
  if (!first) return <p className="p-8">No lessons yet.</p>
  return <Navigate to={`/learn/${first.levelId}/${first.moduleId}/${first.lesson.id}`} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
