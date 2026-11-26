import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'
import {
  extensionStorageGet,
  extensionStorageGetBytesInUse,
  extensionStorageGetQuotaBytes,
  extensionStorageSet,
} from '@/utils/extension-storage'

describe('extension storage', () => {
  it('uses chrome.storage.local directly when the context exposes it', async () => {
    const calls: unknown[] = []
    vi.stubGlobal('chrome', {
      runtime: {
        id: 'extension-id',
        sendMessage: async () => {
          throw new Error('O proxy não deve ser usado quando storage.local está disponível.')
        },
      },
      storage: {
        local: {
          QUOTA_BYTES: 10_485_760,
          get: async (keys: unknown) => {
            calls.push(['get', keys])
            return { auditResultsByTab: { 7: { id: 'audit-direct' } } }
          },
          set: async (items: unknown) => {
            calls.push(['set', items])
          },
          getBytesInUse: async (keys: unknown) => {
            calls.push(['getBytesInUse', keys])
            return 512
          },
        },
      },
    })

    const data = await extensionStorageGet('auditResultsByTab')
    assert.equal((data.auditResultsByTab as Record<number, { id: string }>)[7].id, 'audit-direct')
    await extensionStorageSet({ includeRecommendationsPreference: true })
    assert.equal(await extensionStorageGetBytesInUse(null), 512)
    assert.equal(await extensionStorageGetQuotaBytes(), 10_485_760)
    assert.deepEqual(calls, [
      ['get', 'auditResultsByTab'],
      ['set', { includeRecommendationsPreference: true }],
      ['getBytesInUse', null],
    ])
  })

  it('goes through the service worker when the DevTools panel has no storage API', async () => {
    const requests: unknown[] = []
    vi.stubGlobal('chrome', {
      runtime: {
        id: 'extension-id',
        sendMessage: async (request: { action: string }) => {
          requests.push(request)
          switch (request.action) {
            case 'STORAGE_LOCAL_GET':
              return { data: { auditResultsByTab: { 9: { id: 'audit-proxy' } } } }
            case 'STORAGE_LOCAL_SET':
              return { data: true }
            case 'STORAGE_LOCAL_GET_BYTES_IN_USE':
              return { data: 1024 }
            case 'STORAGE_LOCAL_GET_QUOTA_BYTES':
              return { data: 10_485_760 }
            default:
              return { error: 'Ação de armazenamento desconhecida.' }
          }
        },
      },
    })

    const data = await extensionStorageGet('auditResultsByTab')
    assert.equal((data.auditResultsByTab as Record<number, { id: string }>)[9].id, 'audit-proxy')
    await extensionStorageSet({ includeRecommendationsPreference: false })
    assert.equal(await extensionStorageGetBytesInUse(null), 1024)
    assert.equal(await extensionStorageGetQuotaBytes(), 10_485_760)
    assert.deepEqual(requests, [
      { action: 'STORAGE_LOCAL_GET', keys: 'auditResultsByTab' },
      { action: 'STORAGE_LOCAL_SET', items: { includeRecommendationsPreference: false } },
      { action: 'STORAGE_LOCAL_GET_BYTES_IN_USE', keys: null },
      { action: 'STORAGE_LOCAL_GET_QUOTA_BYTES' },
    ])
  })

  it('fails when the service worker does not answer storage requests', async () => {
    vi.stubGlobal('chrome', {
      runtime: { id: 'extension-id', sendMessage: async () => ({ status: 'UNKNOWN_ACTION' }) },
    })

    await assert.rejects(
      () => extensionStorageGet('auditResultsByTab'),
      /armazenamento local da extensão não está disponível/,
    )
  })
})
