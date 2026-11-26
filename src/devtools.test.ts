import { expect, it, vi } from 'vitest'
import manifest from '../public/manifest.json'

it('registers the audit panel in Chrome DevTools from the manifest devtools page', async () => {
  const create = vi.fn()
  vi.stubGlobal('chrome', { devtools: { panels: { create } } })

  await import('@/devtools')

  expect(manifest.devtools_page).toBe('src/devtools.html')
  expect(create).toHaveBeenCalledWith(
    'Guardião NBR 17225',
    'icons/icon.png',
    'src/devtools-panel.html',
  )
})
