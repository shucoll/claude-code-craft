import { render } from '@testing-library/react'
import { Starfield } from './Starfield'

test('renders a decorative starfield hidden from assistive tech', () => {
  const { container } = render(<Starfield />)
  const el = container.querySelector('.intro-starfield')
  expect(el).not.toBeNull()
  expect(el).toHaveAttribute('aria-hidden', 'true')
})
