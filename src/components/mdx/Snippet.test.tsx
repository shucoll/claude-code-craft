import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { Snippet } from './Snippet'

function renderWithLang(lang: string, ui: React.ReactNode) {
  localStorage.setItem('ccc:lang', JSON.stringify(lang))
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('renders the snippet code for the active language', () => {
  const { container } = renderWithLang('python', <Snippet id="hello-world" />)
  expect(container.querySelector('code')).toHaveTextContent('def greet')
})

test('shows a fallback note when the language lacks the key', () => {
  // "ruby" is not in the registry, so it falls back to the default (JavaScript) pack
  renderWithLang('ruby', <Snippet id="hello-world" />)
  expect(screen.getByText(/example shown in javascript/i)).toBeInTheDocument()
})

test('renders an alert for a completely missing snippet', () => {
  renderWithLang('javascript', <Snippet id="does-not-exist" />)
  expect(screen.getByRole('alert')).toHaveTextContent(/missing snippet/i)
})
