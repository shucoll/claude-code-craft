// src/components/charts/ChartEmbed.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ChartEmbed } from './ChartEmbed'

vi.mock('../../content/curriculum', async () => await import('../../test/curriculumFixture'))

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}|{JSON.stringify(loc.state)}</div>
}

function renderEmbed(id: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/learn/advanced/power/subagents']}>
        <Routes>
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<><ChartEmbed id={id} /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders nothing for an unknown chart id', () => {
  const { container } = renderEmbed('nope')
  expect(container.querySelector('[id^="chart-"]')).toBeNull()
})

test('exposes the scroll anchor id', () => {
  const { container } = renderEmbed('demo')
  expect(container.querySelector('#chart-demo')).not.toBeNull()
})

test('a lesson card navigates with state.from set to the anchor', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Beginner' }))
  const loc = screen.getByTestId('loc').textContent ?? ''
  expect(loc).toContain('/learn/beginner/basics/first-edit')
  expect(loc).toContain('/learn/advanced/power/subagents#chart-demo')
})

test('a popup card opens the modal instead of navigating', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Bash' }))
  expect(await screen.findByRole('dialog')).toHaveAccessibleName('Bash')
  expect(screen.getByTestId('loc').textContent).toContain('/learn/advanced/power/subagents')
})
