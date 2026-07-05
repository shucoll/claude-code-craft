import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { GuidedFlow } from './GuidedFlow'
import type { ChartRow } from '../../content/charts/types'

const row: Extract<ChartRow, { kind: 'flow' }> = {
  kind: 'flow',
  guided: true,
  nodes: [
    { id: 'root', title: 'Root question?', role: 'question' },
    { id: 'mid', title: 'Second question?', role: 'question' },
    {
      id: 'a',
      title: 'Answer A',
      role: 'leaf',
      tone: 'teal',
      lines: ['because reasons'],
      target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) },
    },
    { id: 'b', title: 'Answer B', role: 'leaf' },
  ],
  edges: [
    { from: 'root', to: 'mid', label: 'go deeper' },
    { from: 'root', to: 'b', label: 'shortcut' },
    { from: 'mid', to: 'a', label: 'pick A' },
  ],
}

test('guided mode is the default and shows the root question with its options', () => {
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Root question?' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'go deeper' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'shortcut' })).toBeInTheDocument()
})

test('picking an option advances to the next question', async () => {
  const user = userEvent.setup()
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'go deeper' }))
  expect(screen.getByRole('heading', { name: 'Second question?' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'pick A' })).toBeInTheDocument()
})

test('reaching a leaf shows the recommendation, a path summary, and fires activation', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<GuidedFlow row={row} onActivate={onActivate} />)
  await user.click(screen.getByRole('button', { name: 'go deeper' }))
  await user.click(screen.getByRole('button', { name: 'pick A' }))
  expect(screen.getByText('because reasons')).toBeInTheDocument()
  expect(screen.getByText(/go deeper → pick A/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Answer A' }))
  expect(onActivate).toHaveBeenCalledTimes(1)
  expect(onActivate.mock.calls[0][0]).toMatchObject({ id: 'a', title: 'Answer A' })
})

test('Start over returns to the root question', async () => {
  const user = userEvent.setup()
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'shortcut' })) // root -> leaf b
  expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start over' }))
  expect(screen.getByRole('heading', { name: 'Root question?' })).toBeInTheDocument()
})

test('toggling to Explore renders the FlowView graph (its edge summary)', async () => {
  const user = userEvent.setup()
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'Explore' }))
  expect(await screen.findByText('Root question? → Second question? (go deeper)')).toBeInTheDocument()
})
