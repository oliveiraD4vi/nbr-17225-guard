import { Form } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { t } from '@/i18n'
import { allRules } from '@/rules'
import type { ManualFindingDraft, SeverityLevel } from '@/types'
import type { AuditTargetTab } from '@/utils/audit-engine'
import { getAuditUrlStorageKey } from '@/utils/audit-history'
import { extensionStorageGet, extensionStorageSet } from '@/utils/extension-storage'
import {
  getManualFindingDraftTabKey,
  MANUAL_FINDING_DRAFTS_STORAGE_KEY,
  sanitizeManualFindingDraft,
} from '@/utils/manual-findings'

export interface ManualFindingFormValues {
  ruleId?: string
  severity?: SeverityLevel
  message?: string
  suggestion?: string
  remediationAdvice?: string
  userNote?: string
}

interface ManualFindingDraftOptions {
  tab: AuditTargetTab | null
  notify: { error: (text: string) => void }
  /** Asks the page to let the person pick an element again. */
  startSelection: () => Promise<void>
}

async function readDrafts(): Promise<Record<string, ManualFindingDraft>> {
  const data = await extensionStorageGet(MANUAL_FINDING_DRAFTS_STORAGE_KEY)
  return (data[MANUAL_FINDING_DRAFTS_STORAGE_KEY] as Record<string, ManualFindingDraft>) ?? {}
}

async function clearDraft(tabId: number): Promise<void> {
  const drafts = { ...(await readDrafts()) }
  delete drafts[getManualFindingDraftTabKey(tabId)]
  await extensionStorageSet({ [MANUAL_FINDING_DRAFTS_STORAGE_KEY]: drafts })
}

function isFormValidationError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'errorFields' in error
}

/**
 * Owns the element the person picked on the page to report by hand: the draft the content script
 * stores for the tab, the form that describes it and the drawer that shows both.
 */
export function useManualFindingDraft({ tab, notify, startSelection }: ManualFindingDraftOptions) {
  const [draft, setDraft] = useState<ManualFindingDraft | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form] = Form.useForm<ManualFindingFormValues>()

  const discard = useCallback(async () => {
    if (draft) await clearDraft(draft.tabId)
    setDraft(null)
    setIsOpen(false)
    form.resetFields()
  }, [draft, form])

  const loadDraft = useCallback(
    async (targetTab: AuditTargetTab) => {
      const stored = sanitizeManualFindingDraft(
        (await readDrafts())[getManualFindingDraftTabKey(targetTab.id)],
        targetTab.id,
      )
      // A draft picked on another page of the same tab no longer points at anything.
      const isForAnotherPage =
        stored &&
        targetTab.url &&
        getAuditUrlStorageKey(stored.url) !== getAuditUrlStorageKey(targetTab.url)
      if (isForAnotherPage) await clearDraft(targetTab.id)

      if (!stored || isForAnotherPage) {
        setDraft(null)
        setIsOpen(false)
        return
      }

      setDraft(stored)
      setIsOpen(true)
      form.resetFields()
    },
    [form],
  )

  useEffect(() => {
    if (!tab?.id) return undefined
    void loadDraft(tab)

    // The content script stores the picked element and the service worker announces it.
    const handleDraftChange = (request: { action?: string; tabId?: number }) => {
      if (request.action === 'MANUAL_FINDING_DRAFT_CHANGED' && request.tabId === tab.id) {
        void loadDraft(tab)
      }
    }
    chrome.runtime.onMessage.addListener(handleDraftChange)
    return () => chrome.runtime.onMessage.removeListener(handleDraftChange)
  }, [loadDraft, tab])

  const reselect = useCallback(async () => {
    await discard()
    await startSelection()
  }, [discard, startSelection])

  const selectRule = useCallback(
    (ruleId: string) => {
      const rule = allRules.find((candidate) => candidate.id === ruleId)
      if (rule) form.setFieldsValue({ severity: rule.severity })
    },
    [form],
  )

  /**
   * Validates the form and hands the values to `commit`, which records the finding and resolves to
   * whether it was stored. The draft is discarded once it is.
   */
  const save = useCallback(
    async (
      commit: (values: ManualFindingFormValues, draft: ManualFindingDraft) => Promise<boolean>,
    ) => {
      if (!draft) return

      setIsSaving(true)
      try {
        const values = await form.validateFields()
        if (await commit(values, draft)) await discard()
      } catch (error) {
        if (isFormValidationError(error)) return
        console.error('Erro ao salvar violação manual:', error)
        notify.error(t('popup.messages.manualFindingSaveError'))
      } finally {
        setIsSaving(false)
      }
    },
    [discard, draft, form, notify],
  )

  return {
    draft,
    form,
    isOpen,
    isSaving,
    close: useCallback(() => setIsOpen(false), []),
    cancel: discard,
    reselect,
    selectRule,
    save,
  }
}
