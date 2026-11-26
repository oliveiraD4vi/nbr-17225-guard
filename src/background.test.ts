import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MANUAL_FINDING_DRAFTS_STORAGE_KEY } from '@/utils/manual-findings'

type Listener = (
  request: Record<string, unknown>,
  sender: { tab?: { id: number } },
  sendResponse: (response: unknown) => void,
) => boolean

const storage: Record<string, unknown> = {}
const broadcasts: unknown[] = []
let onMessage: Listener

const fakeChrome = {
  runtime: {
    onInstalled: { addListener: () => undefined },
    onMessage: {
      addListener: (listener: Listener) => {
        onMessage = listener
      },
    },
    sendMessage: async (message: unknown) => {
      broadcasts.push(message)
    },
  },
  storage: {
    local: {
      QUOTA_BYTES: 10_485_760,
      get: async (keys: string | null) =>
        keys === null ? { ...storage } : { [keys]: storage[keys] },
      set: async (items: Record<string, unknown>) => {
        Object.assign(storage, items)
      },
      getBytesInUse: async () => 2048,
    },
  },
}

function installChrome() {
  vi.stubGlobal('chrome', fakeChrome)
  vi.stubGlobal('console', { ...console, log: () => undefined })
}

// The service worker registers its listeners on import, so chrome has to exist first.
beforeAll(async () => {
  installChrome()
  await import('@/background')
})
beforeEach(installChrome)

function send(request: Record<string, unknown>, sender: { tab?: { id: number } } = {}) {
  return new Promise((resolve) => onMessage(request, sender, resolve))
}

describe('storage proxy for the DevTools panel', () => {
  it('writes, reads and measures chrome.storage.local on behalf of the panel', async () => {
    await expect(
      send({ action: 'STORAGE_LOCAL_SET', items: { auditScopePreference: 'site' } }),
    ).resolves.toEqual({ data: true })
    await expect(
      send({ action: 'STORAGE_LOCAL_GET', keys: 'auditScopePreference' }),
    ).resolves.toEqual({ data: { auditScopePreference: 'site' } })
    await expect(send({ action: 'STORAGE_LOCAL_GET_BYTES_IN_USE', keys: null })).resolves.toEqual({
      data: 2048,
    })
    await expect(send({ action: 'STORAGE_LOCAL_GET_QUOTA_BYTES' })).resolves.toEqual({
      data: 10_485_760,
    })
  })

  it('answers unknown actions without throwing', async () => {
    await expect(send({ action: 'NOT_A_REAL_ACTION' })).resolves.toEqual({
      status: 'UNKNOWN_ACTION',
    })
  })
})

describe('manual finding drafts', () => {
  const draft = {
    selector: '#submit',
    snippet: '<button id="submit">Enviar</button>',
    url: 'https://example.com/form',
    selectedAt: 1234,
  }

  it('stores the element picked on the page under its tab and tells the panel', async () => {
    await expect(
      send({ action: 'STORE_MANUAL_FINDING_DRAFT', draft }, { tab: { id: 7 } }),
    ).resolves.toEqual({ status: 'OK' })

    expect(storage[MANUAL_FINDING_DRAFTS_STORAGE_KEY]).toEqual({
      7: expect.objectContaining({ ...draft, tabId: 7 }),
    })
    expect(broadcasts).toContainEqual({ action: 'MANUAL_FINDING_DRAFT_CHANGED', tabId: 7 })
  })

  it('rejects a draft without the element it refers to', async () => {
    const response = await send(
      { action: 'STORE_MANUAL_FINDING_DRAFT', draft: { url: draft.url } },
      { tab: { id: 7 } },
    )

    expect(response).toEqual({ error: expect.any(String) })
  })
})
