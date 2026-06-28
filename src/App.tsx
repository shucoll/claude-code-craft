import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeToggle } from './components/shell/ThemeToggle'
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
            <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
              <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                <span className="font-bold">Claude Code Craft</span>
                <ThemeToggle />
              </header>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
