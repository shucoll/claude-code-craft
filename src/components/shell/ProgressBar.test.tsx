import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../../context/ProgressContext'
import { curriculum } from '../../content/curriculum'
import { lessonIds, percentComplete } from '../../lib/progressMath'
import { ProgressBar } from './ProgressBar'

function wrap(ui: ReactNode) {
  return render(<ProgressProvider>{ui}</ProgressProvider>)
}

test('renders an accessible progressbar at 0% when nothing is completed', () => {
  wrap(<ProgressBar />)
  const bar = screen.getByRole('progressbar', { name: /overall progress/i })
  expect(bar).toHaveAttribute('aria-valuenow', '0')
})

test('reflects completed lessons as a percentage', () => {
  // Derive the expectation from the real curriculum so adding lessons never
  // breaks this test: complete the first lesson and assert the bar shows that
  // fraction (non-zero, and matching the shared percentComplete math).
  const ids = lessonIds(curriculum)
  const progress = { [ids[0]]: 'completed' as const }
  const expected = String(percentComplete(ids, progress))
  localStorage.setItem('ccd:progress', JSON.stringify(progress))
  wrap(<ProgressBar />)
  const bar = screen.getByRole('progressbar', { name: /overall progress/i })
  expect(bar).toHaveAttribute('aria-valuenow', expected)
  expect(Number(expected)).toBeGreaterThan(0)
  expect(screen.getByText(`${expected}%`)).toBeInTheDocument()
})
