import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { IntroScene } from './components/onboarding/intro/IntroScene'
import { LanguageScreen } from './components/onboarding/LanguageScreen'
import { LevelScreen } from './components/onboarding/LevelScreen'
import { RequireOnboarded } from './components/onboarding/RequireOnboarded'
import { RootRedirect } from './components/onboarding/RootRedirect'
import { AppShell } from './components/shell/AppShell'
import { LanguageProvider } from './context/LanguageContext'
import { LevelProvider } from './context/LevelContext'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LevelProvider>
          <ProgressProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/homepage" element={<HomePage />} />
                <Route path="/onboarding" element={<LevelScreen />} />
                <Route path="/onboarding/language" element={<LanguageScreen />} />
                <Route path="/onboarding/intro" element={<IntroScene />} />
                <Route
                  path="/learn/:levelId/:moduleId/:lessonId"
                  element={
                    <RequireOnboarded>
                      <AppShell>
                        <LessonPage />
                      </AppShell>
                    </RequireOnboarded>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </ProgressProvider>
        </LevelProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
