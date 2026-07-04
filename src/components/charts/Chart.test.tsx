import { render, screen } from '@testing-library/react'
import { Chart } from './Chart'
import type { ChartDef } from '../../content/charts/types'

const def: ChartDef = {
  id: 't',
  title: 'Demo',
  rows: [
    { kind: 'cards', cards: [{ id: 'a', title: 'Solo' }] },
    { kind: 'cards', cards: [
      { id: 'b', title: 'Left', target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) } },
      { id: 'c', title: 'Right' },
    ] },
    { kind: 'connector', label: 'unlock: next' },
  ],
}

test('renders the header and every card + connector', () => {
  render(<Chart def={def} onActivate={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Demo' })).toBeInTheDocument()
  expect(screen.getByText('Solo')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Left' })).toBeInTheDocument()
  expect(screen.getByText('Right')).toBeInTheDocument()
  expect(screen.getByText('unlock: next')).toBeInTheDocument()
})

test('a 1-card row is full-width and a 2-card row splits on sm+', () => {
  const { container } = render(<Chart def={def} onActivate={() => {}} />)
  const grids = container.querySelectorAll('[data-testid="chart-cards-row"]')
  expect(grids[0].className).toContain('sm:grid-cols-1')
  expect(grids[1].className).toContain('sm:grid-cols-2')
})

test('renders one arrow between each pair of consecutive rows', () => {
  const { container } = render(<Chart def={def} onActivate={() => {}} />)
  // 3 rows => 2 gaps => 2 arrows
  expect(container.querySelectorAll('[data-testid="chart-arrow"]')).toHaveLength(2)
})

test('renders a flow row as a FlowView (nodes + edge label)', async () => {
  const flowDef: ChartDef = {
    id: 'f',
    rows: [
      {
        kind: 'flow',
        nodes: [
          { id: 'x', title: 'Node X' },
          { id: 'y', title: 'Node Y' },
        ],
        edges: [{ from: 'x', to: 'y', label: 'go' }],
      },
    ],
  }
  render(<Chart def={flowDef} onActivate={() => {}} />)
  expect(await screen.findByText('Node X')).toBeInTheDocument()
  expect(screen.getByText('Node Y')).toBeInTheDocument()
  expect(screen.getByText('go')).toBeInTheDocument()
})
