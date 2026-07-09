import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../../context/ProgressContext'
import { Sidebar } from './Sidebar'

// A fixture whose beginner level has three modules, so "only the active module is
// expanded" is distinguishable from "every module is expanded".
vi.mock('../../content/curriculum', async () => await import('../../test/curriculumFixtureModules'))

function wrap(path: string, ui: ReactNode = <Sidebar />) {
  return render(
    <ProgressProvider>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </ProgressProvider>,
  )
}

const moduleToggle = (name: RegExp) => screen.getByRole('button', { name })

test('every module in the active level gets an expand toggle', () => {
  wrap('/learn/beginner/sessions/first-session')
  expect(moduleToggle(/the basics/i)).toBeInTheDocument()
  expect(moduleToggle(/sessions/i)).toBeInTheDocument()
  expect(moduleToggle(/context/i)).toBeInTheDocument()
})

test('only the route module starts expanded; its siblings stay collapsed', () => {
  wrap('/learn/beginner/sessions/first-session')

  expect(moduleToggle(/sessions/i)).toHaveAttribute('aria-expanded', 'true')
  expect(moduleToggle(/the basics/i)).toHaveAttribute('aria-expanded', 'false')
  expect(moduleToggle(/context/i)).toHaveAttribute('aria-expanded', 'false')

  // Collapsed modules keep their lessons out of the DOM.
  expect(screen.getByRole('link', { name: /your first session/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /what is claude code/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /the context window/i })).not.toBeInTheDocument()
})

test('the module of the restored lesson is the one that expands on reopen', () => {
  // Reopening the platform lands on ccc:lastLesson, so a different route must
  // expand a different module with no stored sidebar state.
  wrap('/learn/beginner/context/context-window')

  expect(moduleToggle(/context/i)).toHaveAttribute('aria-expanded', 'true')
  expect(moduleToggle(/sessions/i)).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('link', { name: /the context window/i })).toBeInTheDocument()
})

test('toggling a module leaves its siblings alone', async () => {
  wrap('/learn/beginner/sessions/first-session')

  await userEvent.click(moduleToggle(/the basics/i))

  expect(moduleToggle(/the basics/i)).toHaveAttribute('aria-expanded', 'true')
  // The route module stays open: modules expand independently, like levels.
  expect(moduleToggle(/sessions/i)).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: /what is claude code/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /your first session/i })).toBeInTheDocument()
})

test('the active module can be collapsed by the user', async () => {
  wrap('/learn/beginner/sessions/first-session')

  await userEvent.click(moduleToggle(/sessions/i))

  expect(moduleToggle(/sessions/i)).toHaveAttribute('aria-expanded', 'false')
})

test('a level with no module in the route falls back to expanding its first module', () => {
  wrap('/')
  expect(moduleToggle(/the basics/i)).toHaveAttribute('aria-expanded', 'true')
  expect(moduleToggle(/sessions/i)).toHaveAttribute('aria-expanded', 'false')
})
