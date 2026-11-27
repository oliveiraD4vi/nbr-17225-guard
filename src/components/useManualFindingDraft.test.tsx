import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MANUAL_FINDING_DRAFTS_STORAGE_KEY } from '@/utils/manual-findings'
import { useManualFindingDraft } from './useManualFindingDraft'

const tab = { id: 7, url: 'https://example.com/form' }
const draft = {
  selector: '#submit',
  snippet: '<button id="submit">Enviar</button>',
  url: 'https://example.com/form',
  selectedAt: 1234,
}

let storage: Record<string, unknown>
let messageListeners: Array<(request: { action?: string; tabId?: number }) => void>

function installChrome(drafts: Record<string, unknown>) {
  storage = { [MANUAL_FINDING_DRAFTS_STORAGE_KEY]: drafts }
  messageListeners = []
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'extension-id',
      onMessage: {
        addListener: (listener: (typeof messageListeners)[number]) =>
          messageListeners.push(listener),
        removeListener: vi.fn(),
      },
    },
    storage: {
      local: {
        get: async (key: string) => ({ [key]: storage[key] }),
        set: async (items: Record<string, unknown>) => Object.assign(storage, items),
      },
    },
  })
}

function renderDraft() {
  return renderHook(() =>
    useManualFindingDraft({
      tab,
      notify: { error: vi.fn() },
      startSelection: vi.fn(async () => undefined),
    }),
  )
}

describe('useManualFindingDraft', () => {
  beforeEach(() => installChrome({}))

  it('opens the element picked on this page', async () => {
    installChrome({ 7: draft })
    const { result } = renderDraft()

    await waitFor(() => expect(result.current.isOpen).toBe(true))
    expect(result.current.draft).toMatchObject({ selector: '#submit', tabId: 7 })
  })

  it('drops an element picked on another page of the tab', async () => {
    installChrome({ 7: { ...draft, url: 'https://example.com/outra' } })
    const { result } = renderDraft()

    await waitFor(() => expect(storage[MANUAL_FINDING_DRAFTS_STORAGE_KEY]).toEqual({}))
    expect(result.current.draft).toBeNull()
    expect(result.current.isOpen).toBe(false)
  })

  it('opens a draft announced while the panel is open', async () => {
    const { result } = renderDraft()
    await waitFor(() => expect(messageListeners).toHaveLength(1))

    storage[MANUAL_FINDING_DRAFTS_STORAGE_KEY] = { 7: draft }
    act(() => messageListeners[0]({ action: 'MANUAL_FINDING_DRAFT_CHANGED', tabId: 7 }))

    await waitFor(() => expect(result.current.isOpen).toBe(true))
  })

  it('removes the stored draft when the person cancels', async () => {
    installChrome({ 7: draft })
    const { result } = renderDraft()
    await waitFor(() => expect(result.current.isOpen).toBe(true))

    await act(() => result.current.cancel())

    expect(storage[MANUAL_FINDING_DRAFTS_STORAGE_KEY]).toEqual({})
    expect(result.current.draft).toBeNull()
  })
})
