import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LedgerEntry } from '../../content/charts/types'
import { LedgerView } from './LedgerView'

const popup = {
  kind: 'popup' as const,
  title: 'CLAUDE.md',
  content: () => Promise.resolve({ default: () => <p>body</p> }),
}

const entries: LedgerEntry[] = [
  { id: 'claude-md', title: 'CLAUDE.md', tokens: 5_000, tone: 'blue', target: popup },
  { id: 'mcp', title: 'MCP tool definitions', tokens: 15_000, tone: 'amber', toggleable: true },
]

const row = { entries, windowTokens: 100_000, label: 'A fresh session', caption: 'Representative numbers.' }

test('renders the label, caption, and one legend row per entry plus free space', () => {
  render(<LedgerView row={row} onActivate={() => {}} />)
  expect(screen.getByText('A fresh session')).toBeInTheDocument()
  expect(screen.getByText('Representative numbers.')).toBeInTheDocument()
  expect(screen.getByText('CLAUDE.md')).toBeInTheDocument()
  expect(screen.getByText('MCP tool definitions')).toBeInTheDocument()
  expect(screen.getByText('Free space')).toBeInTheDocument()
})

test('shares derive from tokens over the window, and free space is the remainder', () => {
  render(<LedgerView row={row} onActivate={() => {}} />)
  const bar = screen.getByRole('group', { name: 'A fresh session' })
  // 5k/100k, 15k/100k, and the 80k left over.
  const widths = Array.from(bar.children).map((child) => (child as HTMLElement).style.width)
  expect(widths).toEqual(['5%', '15%', '80%'])
  // The legend reports every share, including the 5% one the bar is too narrow to label.
  expect(screen.getByText('5%')).toBeInTheDocument()
  expect(within(bar).getByText('80%')).toBeInTheDocument()
})

test('an entry that is off is excluded from the sum and leaves the stack', () => {
  const off: LedgerEntry[] = [
    ...entries,
    { id: 'skills', title: 'Skill index', tokens: 20_000, toggleable: true, defaultOn: false },
  ]
  render(<LedgerView row={{ ...row, entries: off }} onActivate={() => {}} />)
  expect(screen.queryByText('Skill index')).toBeNull()
  // Free space is unchanged: the off entry costs nothing.
  const bar = screen.getByRole('group', { name: 'A fresh session' })
  expect(within(bar).getByText('80%')).toBeInTheDocument()
})

test('entries exceeding the window clamp free space to zero, never a negative width', () => {
  const over: LedgerEntry[] = [{ id: 'huge', title: 'Overstuffed', tokens: 150_000 }]
  render(<LedgerView row={{ entries: over, windowTokens: 100_000 }} onActivate={() => {}} />)

  const bar = screen.getByRole('group', { name: 'Bar' })
  const widths = Array.from(bar.children).map((child) => (child as HTMLElement).style.width)
  expect(widths.every((width) => !width.startsWith('-'))).toBe(true)
  // The free-space segment is present at 0%, and BarView normalizes the overflow
  // back to a full bar.
  expect(widths).toEqual(['100%', '0%'])
  expect(screen.getByText('0%')).toBeInTheDocument()
})

test('entries with a target stay activatable; free space never is', async () => {
  const onActivate = vi.fn()
  render(<LedgerView row={row} onActivate={onActivate} />)

  expect(screen.queryByRole('button', { name: /free space/i })).toBeNull()
  const [barSegment] = screen.getAllByRole('button', { name: /claude\.md/i })
  await userEvent.click(barSegment)

  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'claude-md', tokens: 5_000 }))
})
