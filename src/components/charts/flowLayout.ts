import type { FlowDirection, FlowEdge, FlowNode } from '../../content/charts/types'

export interface Point {
  x: number
  y: number
}

export interface PositionedNode {
  node: FlowNode
  /** Top-left corner (dagre reports centers; converted here). */
  x: number
  y: number
  width: number
  height: number
}

export interface PositionedEdge {
  edge: FlowEdge
  points: Point[]
  labelPoint?: Point
}

export interface FlowLayout {
  nodes: PositionedNode[]
  edges: PositionedEdge[]
  width: number
  height: number
}

interface DagreNode {
  x: number
  y: number
  width: number
  height: number
}

interface DagreEdge {
  points: Point[]
}

interface DagreGraph {
  width?: number
  height?: number
}

/** Fixed node width; also the width the renderer measures node height at. */
export const NODE_WIDTH = 208

export interface NodeSize {
  width: number
  height: number
}

function estimatedHeight(node: FlowNode): number {
  const lineCount = node.lines?.length ?? 0
  return 64 + lineCount * 20
}

/**
 * Compute a directed-graph layout for a flow chart. dagre is dynamically
 * imported so it is code-split out of the main bundle (see the bundle-guard
 * test).
 *
 * `sizeById` supplies real measured node sizes (from the renderer's measuring
 * pass); any node without a positive measured size falls back to a
 * deterministic content estimate, which keeps the function pure and
 * unit-testable in environments without layout (e.g. jsdom).
 */
export async function layoutFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: FlowDirection = 'TB',
  sizeById?: ReadonlyMap<string, NodeSize>,
): Promise<FlowLayout> {
  const dagre = (await import('@dagrejs/dagre')).default
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setGraph({ rankdir: direction, nodesep: 48, ranksep: 64, marginx: 8, marginy: 8 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    const measured = sizeById?.get(node.id)
    const width = measured && measured.width > 0 ? measured.width : NODE_WIDTH
    const height = measured && measured.height > 0 ? measured.height : estimatedHeight(node)
    g.setNode(node.id, { width, height })
  }
  edges.forEach((edge, i) => {
    g.setEdge(edge.from, edge.to, {}, `e${i}`)
  })

  dagre.layout(g)

  const positionedNodes: PositionedNode[] = nodes.map((node) => {
    const { x, y, width, height } = g.node(node.id) as DagreNode
    return { node, x: x - width / 2, y: y - height / 2, width, height }
  })
  const positionedEdges: PositionedEdge[] = edges.map((edge, i) => {
    const { points } = g.edge({ v: edge.from, w: edge.to, name: `e${i}` }) as DagreEdge
    return { edge, points, labelPoint: points[Math.floor(points.length / 2)] }
  })
  const graph = g.graph() as DagreGraph
  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width: graph.width ?? 0,
    height: graph.height ?? 0,
  }
}
