import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { FlowView } from './FlowView'
import type { ChartRow } from '../../content/charts/types'

const row: Extract<ChartRow, { kind: 'flow' }> = {
  kind: 'flow',
  nodes: [
    { id: 'q', title: 'Question', role: 'question' },
    {
      id: 'yes',
      title: 'Yes leaf',
      role: 'leaf',
      target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) },
    },
    { id: 'no', title: 'No leaf', role: 'leaf' },
  ],
  edges: [
    { from: 'q', to: 'yes', label: 'affirmative' },
    { from: 'q', to: 'no', label: 'negative' },
  ],
}

test('renders each node after layout resolves', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByText('Question')).toBeInTheDocument()
  expect(screen.getByText('Yes leaf')).toBeInTheDocument()
  expect(screen.getByText('No leaf')).toBeInTheDocument()
})

test('renders edge labels', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByText('affirmative')).toBeInTheDocument()
  expect(screen.getByText('negative')).toBeInTheDocument()
})

test('interactive node is a button; inert node is not', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByRole('button', { name: 'Yes leaf' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'No leaf' })).toBeNull()
})

test('activating a node calls onActivate with the mapped card', async () => {
  const onActivate = vi.fn()
  render(<FlowView row={row} onActivate={onActivate} />)
  const btn = await screen.findByRole('button', { name: 'Yes leaf' })
  btn.click()
  expect(onActivate).toHaveBeenCalledTimes(1)
  expect(onActivate.mock.calls[0][0]).toMatchObject({ id: 'yes', title: 'Yes leaf' })
})

test('exposes a screen-reader edge summary', async () => {
  render(<FlowView row={row} onActivate={() => {}} />)
  expect(await screen.findByText('Question → Yes leaf (affirmative)')).toBeInTheDocument()
})
