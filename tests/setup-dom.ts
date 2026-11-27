import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ant Design reads these browser APIs, which jsdom does not implement.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList

window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does not implement pseudo-element styles and logs an error for each request; Ant Design asks
// for them when it measures scrollbars. Styles of the element itself are what the tests need.
const getElementStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = (element: Element) => getElementStyle(element)

afterEach(cleanup)
