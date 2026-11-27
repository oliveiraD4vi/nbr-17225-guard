import { useCallback, useMemo, useRef, useState } from 'react'
import { t, type TextKey } from '@/i18n'
import type { AuditHistoryEntry } from '@/types'
import {
  clearAuditHistoryForUrl,
  compactAuditStorage,
  deleteOldestAuditHistoryEntry,
  getAuditHistoryForUrl,
  getAuditStorageDiagnostics,
  isAuditStorageQuotaError,
  type AuditStorageDiagnostics,
} from '@/utils/audit-engine'

export interface QuotaIssue {
  url: string
  scope: 'audit' | 'history' | 'review'
  hasUnsavedChanges: boolean
}

interface StorageWarning {
  titleKey: TextKey
  descriptionKey: TextKey
  type: 'error' | 'warning'
}

export type QuotaRecoveryStrategy = 'current-url' | 'oldest-audit' | 'global'

interface Notifier {
  error: (text: string) => void
  success: (text: string) => void
}

interface StorageQuotaOptions {
  tabId?: number
  notify: Notifier
  /** Called with the page's history after storage was cleaned up. */
  onHistoryChange: (url: string, history: AuditHistoryEntry[]) => void
}

/**
 * Owns how the panel deals with chrome.storage.local filling up: the usage diagnostics, a save that
 * failed for lack of space and can be retried after cleaning up, and the cleanups themselves.
 */
export function useStorageQuota({ tabId, notify, onHistoryChange }: StorageQuotaOptions) {
  const [diagnostics, setDiagnostics] = useState<AuditStorageDiagnostics | null>(null)
  const [issue, setIssue] = useState<QuotaIssue | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [isCompacting, setIsCompacting] = useState(false)
  const retryRef = useRef<(() => Promise<unknown>) | null>(null)

  const refreshDiagnostics = useCallback(async (url?: string) => {
    try {
      setDiagnostics(await getAuditStorageDiagnostics(url))
    } catch (error) {
      console.error('Erro ao calcular uso do armazenamento local:', error)
      setDiagnostics(null)
    }
  }, [])

  const clearIssue = useCallback(() => {
    setIssue(null)
    setIsModalOpen(false)
    retryRef.current = null
  }, [])

  /** Runs a save; when storage is full, keeps it for a retry after cleanup and returns null. */
  const persist = useCallback(
    async <T>(operation: () => Promise<T>, failedSave: QuotaIssue): Promise<T | null> => {
      try {
        const result = await operation()
        await refreshDiagnostics(failedSave.url)
        clearIssue()
        return result
      } catch (error) {
        if (!isAuditStorageQuotaError(error)) throw error

        await refreshDiagnostics(failedSave.url)
        retryRef.current = operation
        setIssue(failedSave)
        setIsModalOpen(true)
        return null
      }
    },
    [clearIssue, refreshDiagnostics],
  )

  const recover = useCallback(
    async (strategy: QuotaRecoveryStrategy) => {
      if (!issue || !retryRef.current) return

      setIsRecovering(true)
      try {
        if (strategy === 'current-url') {
          await clearAuditHistoryForUrl(issue.url)
        } else if (strategy === 'oldest-audit') {
          await deleteOldestAuditHistoryEntry()
        } else {
          await compactAuditStorage(tabId)
        }

        await retryRef.current()
        onHistoryChange(issue.url, await getAuditHistoryForUrl(issue.url))
        await refreshDiagnostics(issue.url)
        clearIssue()
        notify.success(t('popup.messages.quotaRecovered'))
      } catch (error) {
        console.error('Erro ao recuperar quota do storage:', error)
        notify.error(
          !isAuditStorageQuotaError(error) && error instanceof Error
            ? error.message
            : t('popup.messages.quotaRecoveryFailed'),
        )
      } finally {
        setIsRecovering(false)
      }
    },
    [clearIssue, issue, notify, onHistoryChange, refreshDiagnostics, tabId],
  )

  const compact = useCallback(
    async (historyUrl?: string) => {
      setIsCompacting(true)
      try {
        await compactAuditStorage(tabId)
        if (historyUrl) onHistoryChange(historyUrl, await getAuditHistoryForUrl(historyUrl))
        await refreshDiagnostics(historyUrl)
        notify.success(t('popup.messages.storageCompacted'))
      } catch (error) {
        console.error('Erro ao compactar armazenamento local:', error)
        notify.error(t('popup.messages.storageCompactError'))
      } finally {
        setIsCompacting(false)
      }
    },
    [notify, onHistoryChange, refreshDiagnostics, tabId],
  )

  const warning = useMemo((): StorageWarning | null => {
    if (!diagnostics || diagnostics.level === 'ok') return null

    const isCritical = diagnostics.level === 'critical'
    return {
      titleKey: isCritical ? 'popup.storage.criticalTitle' : 'popup.storage.warningTitle',
      descriptionKey: isCritical
        ? 'popup.storage.criticalDescription'
        : 'popup.storage.warningDescription',
      type: isCritical ? 'error' : 'warning',
    }
  }, [diagnostics])

  return {
    diagnostics,
    warning,
    refreshDiagnostics,
    persist,
    issue,
    isModalOpen,
    openModal: useCallback(() => setIsModalOpen(true), []),
    closeModal: useCallback(() => setIsModalOpen(false), []),
    recover,
    isRecovering,
    compact,
    isCompacting,
  }
}
