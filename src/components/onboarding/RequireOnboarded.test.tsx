import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireOnboarded } from './RequireOnboarded'

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/learn/x']}>
      <Routes>
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        <Route
          path="/learn/x"
          element={
            <RequireOnboarded>
              <div>PROTECTED</div>
            </RequireOnboarded>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

test('redirects to onboarding when not onboarded', () => {
  renderGuarded()
  expect(screen.getByText('ONBOARDING')).toBeInTheDocument()
})

test('renders children when onboarded', () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  renderGuarded()
  expect(screen.getByText('PROTECTED')).toBeInTheDocument()
})
