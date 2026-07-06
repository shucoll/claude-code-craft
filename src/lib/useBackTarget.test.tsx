import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useBackTarget } from './useBackTarget'

vi.mock('../content/curriculum', async () => await import('../test/curriculumFixture'))

function Probe() {
  return <div data-testid="back">{String(useBackTarget())}</div>
}

function renderAt(entry: { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/learn/:levelId/:moduleId/:lessonId" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('prefers state.from when present', () => {
  renderAt({ pathname: '/learn/beginner/basics/first-edit', state: { from: '/learn/advanced/power/subagents#chart-demo' } })
  expect(screen.getByTestId('back')).toHaveTextContent('/learn/advanced/power/subagents#chart-demo')
})

test('falls back to the previous curriculum lesson', () => {
  renderAt({ pathname: '/learn/beginner/basics/first-edit' })
  expect(screen.getByTestId('back')).toHaveTextContent('/learn/beginner/basics/what-is-cc')
})

test('returns null on the first lesson with no origin', () => {
  renderAt({ pathname: '/learn/beginner/basics/what-is-cc' })
  expect(screen.getByTestId('back')).toHaveTextContent('null')
})
