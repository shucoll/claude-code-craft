import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressGlyph } from './ProgressGlyph'

describe('ProgressGlyph', () => {
  it('labels the completed state', () => {
    render(<ProgressGlyph status="completed" />)
    expect(screen.getByRole('img', { name: 'Completed' })).toBeInTheDocument()
  })

  it('labels the current state', () => {
    render(<ProgressGlyph status="current" />)
    expect(screen.getByRole('img', { name: 'Current lesson' })).toBeInTheDocument()
  })

  it('labels the unvisited state', () => {
    render(<ProgressGlyph status="unvisited" />)
    expect(screen.getByRole('img', { name: 'Not started' })).toBeInTheDocument()
  })
})
