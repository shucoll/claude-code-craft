import { render, screen } from '@testing-library/react'
import { MDXProvider } from '@mdx-js/react'
import Sample from './fixtures/sample.mdx'

test('renders an .mdx file as a React component', () => {
  render(<Sample />)
  expect(screen.getByRole('heading', { name: /sample heading/i })).toBeInTheDocument()
})

test('MDXProvider supplies components to compiled MDX', () => {
  render(
    <MDXProvider components={{ h1: (props) => <h1 data-testid="custom-h1" {...props} /> }}>
      <Sample />
    </MDXProvider>,
  )
  expect(screen.getByTestId('custom-h1')).toBeInTheDocument()
})
