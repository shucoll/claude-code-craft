import { ThemeProvider } from './context/ThemeContext'
import { ThemeToggle } from './components/shell/ThemeToggle'

export default function App() {
  return (
    <ThemeProvider>
      <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between p-8">
          <h1 className="text-2xl font-bold">Claude Code Craft</h1>
          <ThemeToggle />
        </div>
      </main>
    </ThemeProvider>
  )
}
