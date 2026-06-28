import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Body</Card>)
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('adds an interactive affordance only when interactive', () => {
    const { rerender } = render(<Card data-testid="c">x</Card>)
    expect(screen.getByTestId('c').className).not.toContain('cursor-pointer')
    rerender(
      <Card data-testid="c" interactive>
        x
      </Card>,
    )
    expect(screen.getByTestId('c').className).toContain('cursor-pointer')
  })
})
