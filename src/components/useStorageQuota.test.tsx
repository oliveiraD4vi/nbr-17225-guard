import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuditStorageQuotaError } from '@/utils/audit-engine'
import { useStorageQuota } from './useStorageQuota'

const engine = vi.hoisted(() => ({
  clearAuditHistoryForUrl: vi.fn(async () => undefined),
  compactAuditStorage: vi.fn(async () => undefined),
  deleteOldestAuditHistoryEntry: vi.fn(async () => undefined),
  getAuditHistoryForUrl: vi.fn(async () => []),
  getAuditStorageDiagnostics: vi.fn(async () => ({ level: 'ok' })),
}))

vi.mock('@/utils/audit-engine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/audit-engine')>()),
  ...engine,
}))

const failedSave = { url: 'https://example.com', scope: 'audit' as const, hasUnsavedChanges: true }

function renderQuota() {
  const notify = { error: vi.fn(), success: vi.fn() }
  const onHistoryChange = vi.fn()
  const hook = renderHook(() => useStorageQuota({ tabId: 7, notify, onHistoryChange }))
  return { hook, notify, onHistoryChange }
}

describe('useStorageQuota', () => {
  it('returns what a successful save returns', async () => {
    const { hook } = renderQuota()

    let saved: string | null = null
    await act(async () => {
      saved = await hook.result.current.persist(async () => 'gravado', failedSave)
    })

    expect(saved).toBe('gravado')
    expect(hook.result.current.issue).toBeNull()
  })

  it('keeps a save that ran out of space and asks how to free it', async () => {
    const { hook } = renderQuota()

    await act(async () => {
      await hook.result.current.persist(async () => {
        throw new AuditStorageQuotaError('cheio')
      }, failedSave)
    })

    expect(hook.result.current.issue).toEqual(failedSave)
    expect(hook.result.current.isModalOpen).toBe(true)
  })

  it('frees space with the chosen strategy and retries the save', async () => {
    const { hook, notify, onHistoryChange } = renderQuota()
    const save = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new AuditStorageQuotaError('cheio'))
      .mockResolvedValueOnce('gravado')

    await act(async () => {
      await hook.result.current.persist(save, failedSave)
    })
    await act(async () => {
      await hook.result.current.recover('oldest-audit')
    })

    expect(engine.deleteOldestAuditHistoryEntry).toHaveBeenCalled()
    expect(save).toHaveBeenCalledTimes(2)
    expect(onHistoryChange).toHaveBeenCalledWith(failedSave.url, [])
    expect(hook.result.current.issue).toBeNull()
    expect(notify.success).toHaveBeenCalled()
  })

  it('lets other failures through', async () => {
    const { hook } = renderQuota()

    await expect(
      hook.result.current.persist(async () => {
        throw new Error('rede')
      }, failedSave),
    ).rejects.toThrow('rede')
  })
})
