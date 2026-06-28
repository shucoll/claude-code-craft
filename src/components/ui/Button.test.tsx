import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Start Learning</Button>)
    expect(screen.getByRole('button', { name: 'Start Learning' })).toBeInTheDocument()
  })

  it('reflects variant and size via data attributes', () => {
    render(
      <Button variant="secondary" size="sm">
        Browse
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Browse' })
    expect(btn).toHaveAttribute('data-variant', 'secondary')
    expect(btn).toHaveAttribute('data-size', 'sm')
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows a spinner and disables while loading', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn.querySelector('svg')).toBeTruthy()
  })

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
