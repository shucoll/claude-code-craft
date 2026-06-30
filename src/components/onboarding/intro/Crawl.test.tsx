import { fireEvent, render, screen } from '@testing-library/react'
import { INTRO_CONTENT } from './introContent'
import { Crawl } from './Crawl'

test('renders the opening line, title, and paragraphs', () => {
  render(<Crawl content={INTRO_CONTENT} onComplete={() => {}} />)
  expect(screen.getByText(INTRO_CONTENT.openingLine)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  expect(screen.getByText(INTRO_CONTENT.paragraphs[0])).toBeInTheDocument()
})

test('calls onComplete when the crawl scroll animation ends', () => {
  const onComplete = vi.fn()
  render(<Crawl content={INTRO_CONTENT} onComplete={onComplete} />)
  fireEvent.animationEnd(screen.getByTestId('intro-crawl'), { animationName: 'intro-crawl-scroll' })
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('ignores unrelated animationend events', () => {
  const onComplete = vi.fn()
  render(<Crawl content={INTRO_CONTENT} onComplete={onComplete} />)
  fireEvent.animationEnd(screen.getByTestId('intro-crawl'), { animationName: 'intro-twinkle' })
  expect(onComplete).not.toHaveBeenCalled()
})
