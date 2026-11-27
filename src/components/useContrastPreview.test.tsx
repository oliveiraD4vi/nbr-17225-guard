import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { t } from '@/i18n'
import type { Violation } from '@/types'
import { useContrastPreview } from './useContrastPreview'

vi.mock('@/utils/audit-engine', () => ({ ensureContentScriptReady: async () => undefined }))

const tab = { id: 7, url: 'https://example.com' }
const colors = { foregroundHex: '#000000', backgroundHex: '#ffffff' }

function contrastViolation(id: string): Violation {
  return {
    id,
    elementSelector: `#${id}`,
    contrastDetails: { context: 'text' },
  } as unknown as Violation
}

let port: { disconnect: ReturnType<typeof vi.fn>; onDisconnect: { addListener: () => void } }

function renderPreview({ isEnabled = true, missing = 0 } = {}) {
  const notify = { warning: vi.fn() }
  const sendToPage = vi.fn(async (payload: Record<string, unknown>) =>
    payload.action === 'SYNC_CONTRAST_PREVIEWS'
      ? { result: { applied: 1, missing, unsupported: 0 } }
      : undefined,
  )
  const hook = renderHook(() => useContrastPreview({ tab, isEnabled, notify, sendToPage }))
  return { hook, notify, sendToPage }
}

describe('useContrastPreview', () => {
  beforeEach(() => {
    port = { disconnect: vi.fn(), onDisconnect: { addListener: () => undefined } }
    vi.stubGlobal('chrome', { tabs: { connect: vi.fn(() => port) } })
  })

  it('keeps every color tried on the page in one session', async () => {
    const { hook, sendToPage } = renderPreview()

    await act(() => hook.result.current.preview(contrastViolation('a'), colors))
    await act(() => hook.result.current.preview(contrastViolation('b'), colors))

    expect(chrome.tabs.connect).toHaveBeenCalledTimes(1)
    expect(sendToPage).toHaveBeenLastCalledWith({
      action: 'SYNC_CONTRAST_PREVIEWS',
      previews: [
        expect.objectContaining({ id: 'a', selector: '#a' }),
        expect.objectContaining({ id: 'b', selector: '#b' }),
      ],
    })
  })

  it('leaves the page alone while it shows another audit', async () => {
    const { hook, sendToPage } = renderPreview({ isEnabled: false })

    await act(() => hook.result.current.preview(contrastViolation('a'), colors))

    expect(sendToPage).not.toHaveBeenCalled()
  })

  it('warns once when the page no longer has the element', async () => {
    const { hook, notify } = renderPreview({ missing: 1 })

    await act(() => hook.result.current.preview(contrastViolation('a'), colors))
    await act(() => hook.result.current.preview(contrastViolation('a'), colors))

    expect(notify.warning).toHaveBeenCalledTimes(1)
    expect(notify.warning).toHaveBeenCalledWith(t('popup.messages.contrastPreviewUnavailable'))
  })

  it('reports how many of a bulk preview the page could not show', async () => {
    const { hook, notify } = renderPreview({ missing: 2 })

    await act(() =>
      hook.result.current.previewAll([contrastViolation('a'), contrastViolation('b')], colors),
    )

    expect(notify.warning).toHaveBeenCalledWith(
      t('popup.messages.contrastPreviewPartial', { count: 2 }),
    )
  })

  it('restores the page and closes the session when cleared', async () => {
    const { hook, sendToPage } = renderPreview()
    await act(() => hook.result.current.preview(contrastViolation('a'), colors))

    await act(() => hook.result.current.clear())

    expect(sendToPage).toHaveBeenLastCalledWith({ action: 'CLEAR_CONTRAST_PREVIEWS' })
    expect(port.disconnect).toHaveBeenCalled()
  })
})
