import { render, screen, within } from '@testing-library/react'
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

test('grid rows are never joined to a neighbour by an arrow', () => {
  // Grids are reference material: an arrow between them would imply an order
  // the entries do not have.
  const gridDef: ChartDef = {
    id: 'g',
    rows: [
      { kind: 'grid', items: [{ id: 'a', title: '/one' }] },
      { kind: 'grid', items: [{ id: 'b', title: '/two' }] },
      { kind: 'cards', cards: [{ id: 'c', title: 'After' }] },
    ],
  }
  const { container } = render(<Chart def={gridDef} onActivate={() => {}} />)
  expect(container.querySelectorAll('[data-testid="chart-arrow"]')).toHaveLength(0)
  expect(screen.getAllByTestId('chart-grid-row')).toHaveLength(2)
  // …but they still get the arrow's vertical rhythm, or the hard shadow of the
  // cards above lands on the next row's label. 3 rows => 2 gaps.
  expect(screen.getAllByTestId('chart-row-gap')).toHaveLength(2)
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

test('renders a ledger row as a LedgerView (derived shares + free space)', () => {
  const ledgerDef: ChartDef = {
    id: 'l',
    rows: [
      {
        kind: 'ledger',
        windowTokens: 100_000,
        entries: [{ id: 'md', title: 'CLAUDE.md', tokens: 25_000 }],
      },
    ],
  }
  render(<Chart def={ledgerDef} onActivate={() => {}} />)
  expect(screen.getByText('CLAUDE.md')).toBeInTheDocument()
  expect(screen.getByText('Free space')).toBeInTheDocument()
  const bar = screen.getByRole('group', { name: 'Bar' })
  expect(within(bar).getByText('25%')).toBeInTheDocument()
  expect(within(bar).getByText('75%')).toBeInTheDocument()
})

test('renders a guided flow row as a GuidedFlow (mode toggle present)', () => {
  const guidedDef: ChartDef = {
    id: 'g',
    rows: [
      {
        kind: 'flow',
        guided: true,
        nodes: [
          { id: 'q', title: 'Pick one', role: 'question' },
          { id: 'l', title: 'A leaf', role: 'leaf' },
        ],
        edges: [{ from: 'q', to: 'l', label: 'only option' }],
      },
    ],
  }
  render(<Chart def={guidedDef} onActivate={() => {}} />)
  expect(screen.getByRole('button', { name: 'Guided' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Pick one' })).toBeInTheDocument()
})
