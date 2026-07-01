import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Popup } from './Popup'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Popup open={open} onClose={() => setOpen(false)} title="Hello">
        <p>Body content</p>
      </Popup>
    </>
  )
}

test('renders nothing when closed', () => {
  render(<Popup open={false} onClose={() => {}} title="X">hi</Popup>)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('shows title and children when open', () => {
  render(<Popup open onClose={() => {}} title="Hello"><p>Body content</p></Popup>)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAccessibleName('Hello')
  expect(screen.getByText('Body content')).toBeInTheDocument()
})

test('uses ariaLabel as the accessible name when no title is given', () => {
  render(<Popup open onClose={() => {}} ariaLabel="Details"><p>Body</p></Popup>)
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Details')
})

test('closes on Escape, backdrop click, and the close button', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Popup open onClose={onClose} title="Hello">body</Popup>)

  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(1)

  await user.click(screen.getByTestId('popup-backdrop'))
  expect(onClose).toHaveBeenCalledTimes(2)

  await user.click(screen.getByRole('button', { name: /close/i }))
  expect(onClose).toHaveBeenCalledTimes(3)
})

test('restores focus to the trigger on close', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  const trigger = screen.getByRole('button', { name: 'open' })
  await user.click(trigger)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(trigger).toHaveFocus()
})

test('tab cycle wraps focus through focusables', async () => {
  const user = userEvent.setup()
  render(
    <Popup open onClose={() => {}} title="Title">
      <button>one</button>
      <button>two</button>
    </Popup>
  )

  const dialog = screen.getByRole('dialog')
  const closeBtn = screen.getByRole('button', { name: /close/i })
  const buttonOne = screen.getByRole('button', { name: 'one' })
  const buttonTwo = screen.getByRole('button', { name: 'two' })

  // Dialog gets initial focus on open
  expect(dialog).toHaveFocus()

  // Tab from dialog goes to first focusable (close button)
  await user.keyboard('{Tab}')
  expect(closeBtn).toHaveFocus()

  // Tab continues to button one
  await user.keyboard('{Tab}')
  expect(buttonOne).toHaveFocus()

  // Tab continues to button two
  await user.keyboard('{Tab}')
  expect(buttonTwo).toHaveFocus()

  // Tab from last wraps to first (close button)
  await user.keyboard('{Tab}')
  expect(closeBtn).toHaveFocus()

  // Shift+Tab from first focusable wraps to last
  await user.keyboard('{Shift>}{Tab}{/Shift}')
  expect(buttonTwo).toHaveFocus()
})
