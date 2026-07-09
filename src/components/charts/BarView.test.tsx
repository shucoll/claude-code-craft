import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ChartBarSegment } from '../../content/charts/types'
import { BarView } from './BarView'

const popup = {
  kind: 'popup' as const,
  title: 'Reads',
  content: () => Promise.resolve({ default: () => <p>body</p> }),
}

const segments: ChartBarSegment[] = [
  { id: 'reads', title: 'File reads', percent: 30, tone: 'violet', target: popup },
  { id: 'tiny', title: 'Tiny slice', percent: 2, tone: 'amber', target: popup },
  { id: 'free', title: 'Free space', percent: 68, tone: 'neutral' },
]

const row = { segments, label: 'A session', caption: 'Representative proportions.' }

test('renders the row label, caption, and one bar segment per entry', () => {
  render(<BarView row={row} onActivate={() => {}} />)
  expect(screen.getByText('A session')).toBeInTheDocument()
  expect(screen.getByText('Representative proportions.')).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'A session' })).toBeInTheDocument()
})

test('segment widths are normalized against the row total', () => {
  render(<BarView row={{ segments: [
    { id: 'a', title: 'A', percent: 1 },
    { id: 'b', title: 'B', percent: 3 },
  ] }} onActivate={() => {}} />)
  const bar = screen.getByRole('group', { name: 'Bar' })
  const [a, b] = Array.from(bar.children) as HTMLElement[]
  expect(a.style.width).toBe('25%')
  expect(b.style.width).toBe('75%')
})

test('only segments with a target are clickable, in the bar and the legend', () => {
  render(<BarView row={row} onActivate={() => {}} />)
  // "File reads" appears twice (bar segment + legend row), both as buttons.
  expect(screen.getAllByRole('button', { name: /file reads/i })).toHaveLength(2)
  // The inert segment is never a button, in either place.
  expect(screen.queryByRole('button', { name: /free space/i })).toBeNull()
  expect(screen.getByText('Free space')).toBeInTheDocument()
})

test('a narrow segment hides its percent label but keeps it in the legend', () => {
  render(<BarView row={row} onActivate={() => {}} />)
  const bar = screen.getByRole('group', { name: 'A session' })
  // 30% is wide enough to render its own label inside the bar; 2% is not.
  expect(within(bar).getByText('30%')).toBeInTheDocument()
  expect(within(bar).queryByText('2%')).toBeNull()
  // The legend still reports it, so the slice stays readable.
  expect(screen.getByText('2%')).toBeInTheDocument()
})

test('activating a segment passes it to onActivate', async () => {
  const onActivate = vi.fn()
  render(<BarView row={row} onActivate={onActivate} />)

  const [barSegment] = screen.getAllByRole('button', { name: /file reads/i })
  await userEvent.click(barSegment)

  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'reads' }))
})
