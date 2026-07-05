import { render, screen } from '@testing-library/react'
import { LessonDocsLinks } from './LessonDocsLinks'

test('renders a labelled nav with one external link per url', () => {
  render(
    <LessonDocsLinks
      urls={['https://code.claude.com/docs/en/overview', 'https://code.claude.com/docs/en/hooks.md']}
    />,
  )
  expect(screen.getByRole('navigation', { name: 'Official docs' })).toBeInTheDocument()

  const overview = screen.getByRole('link', { name: 'overview' })
  expect(overview).toHaveAttribute('href', 'https://code.claude.com/docs/en/overview')
  expect(overview).toHaveAttribute('target', '_blank')
  expect(overview).toHaveAttribute('rel', expect.stringContaining('noopener'))

  // The `.md` suffix is stripped from the derived label.
  expect(screen.getByRole('link', { name: 'hooks' })).toBeInTheDocument()
})

test('renders nothing when there are no urls', () => {
  const { container } = render(<LessonDocsLinks urls={[]} />)
  expect(container.textContent).toBe('')
})
