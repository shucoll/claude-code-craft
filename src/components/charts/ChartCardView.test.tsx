import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartCardView } from './ChartCardView'
import type { ChartCard } from '../../content/charts/types'

const lessonCard: ChartCard = {
  id: 'c1',
  title: 'Beginner',
  lines: ['operator · the turn'],
  tone: 'blue',
  target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) },
}
const inertCard: ChartCard = { id: 'c2', title: 'Just a label', tone: 'neutral' }

test('interactive card is a button showing title + lines and fires onActivate on click and keyboard', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<ChartCardView card={lessonCard} onActivate={onActivate} />)
  const btn = screen.getByRole('button', { name: 'Beginner' })
  expect(screen.getByText('operator · the turn')).toBeInTheDocument()

  await user.click(btn)
  btn.focus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  expect(onActivate).toHaveBeenCalledTimes(3)
  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }))
})

test('targetless card is inert and applies its tone surface class', () => {
  render(<ChartCardView card={inertCard} onActivate={() => {}} />)
  expect(screen.queryByRole('button')).toBeNull()
  const el = screen.getByText('Just a label').closest('div')
  expect(el?.className).toContain('bg-chart-neutral-bg')
})

// A permission rule or MCP tool name has no spaces, so it is one unbreakable
// word: without these two classes it renders straight through the card's border.
test('a long unbroken title wraps inside the card instead of overflowing it', () => {
  const longTitle = 'WebFetch(domain:*.example.com)'
  render(<ChartCardView card={{ id: 'c3', title: longTitle, tone: 'violet' }} onActivate={() => {}} />)
  const heading = screen.getByRole('heading', { name: longTitle })
  expect(heading.className).toContain('break-words')
  expect(heading.closest('div')?.className).toContain('min-w-0')
})
