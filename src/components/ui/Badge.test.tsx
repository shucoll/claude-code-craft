import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>Beginner</Badge>)
    expect(screen.getByText('Beginner')).toBeInTheDocument()
  })

  it('exposes the tone via a data attribute', () => {
    render(<Badge tone="success">Done</Badge>)
    expect(screen.getByText('Done')).toHaveAttribute('data-tone', 'success')
  })
})
