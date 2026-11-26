import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { VisionSimulator } from './VisionSimulator'

it('labels every control', () => {
  render(<VisionSimulator />)

  for (const control of [...screen.getAllByRole('button'), ...screen.getAllByRole('slider')]) {
    const name =
      control.getAttribute('aria-label') ??
      control.getAttribute('aria-labelledby') ??
      control.textContent?.trim()
    expect(name, control.outerHTML).toBeTruthy()
  }
})
