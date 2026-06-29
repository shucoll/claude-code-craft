import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../../context/ProgressContext'
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
  // 4 lessons in the stub curriculum; completing 1 → 25%
  localStorage.setItem('ccc:progress', JSON.stringify({ 'what-is-cc': 'completed' }))
  wrap(<ProgressBar />)
  expect(screen.getByRole('progressbar', { name: /overall progress/i })).toHaveAttribute(
    'aria-valuenow',
    '25',
  )
  expect(screen.getByText('25%')).toBeInTheDocument()
})
