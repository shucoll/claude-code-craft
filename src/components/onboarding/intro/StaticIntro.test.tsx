import { render, screen } from '@testing-library/react'
import { INTRO_CONTENT } from './introContent'
import { StaticIntro } from './StaticIntro'

test('renders the title as a heading and every paragraph', () => {
  render(<StaticIntro content={INTRO_CONTENT} />)
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  for (const p of INTRO_CONTENT.paragraphs) {
    expect(screen.getByText(p)).toBeInTheDocument()
  }
})
