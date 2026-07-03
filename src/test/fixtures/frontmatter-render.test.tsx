import { render, screen } from '@testing-library/react'
import Probe from './withFrontmatter.mdx'

test('frontmatter YAML is stripped from rendered MDX', () => {
  render(<Probe />)
  expect(screen.getByText('Body heading')).toBeInTheDocument()
  expect(screen.queryByText(/id: "probe-1"/)).not.toBeInTheDocument()
})
