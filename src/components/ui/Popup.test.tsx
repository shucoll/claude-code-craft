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
