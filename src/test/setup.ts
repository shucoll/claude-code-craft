import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeEach(() => {
  // Reset the URL so BrowserRouter-based tests always start at the root.
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', '/')
  }
})

afterEach(() => {
  if (typeof window !== 'undefined') {
    cleanup()
    localStorage.clear()
  }
})

// jsdom lacks the AnimationEvent constructor, so fireEvent.animationEnd cannot
// carry `animationName`. Provide a minimal shim that preserves it (and the other
// animation fields) so animation-driven handlers are testable.
if (typeof window !== 'undefined' && typeof window.AnimationEvent === 'undefined') {
  class AnimationEventShim extends Event {
    readonly animationName: string
    readonly elapsedTime: number
    readonly pseudoElement: string
    constructor(
      type: string,
      init: AnimationEventInit = {},
    ) {
      super(type, init)
      this.animationName = init.animationName ?? ''
      this.elapsedTime = init.elapsedTime ?? 0
      this.pseudoElement = init.pseudoElement ?? ''
    }
  }
  window.AnimationEvent = AnimationEventShim as unknown as typeof AnimationEvent
}

// jsdom lacks matchMedia; provide a stub that reports light (matches: false).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
