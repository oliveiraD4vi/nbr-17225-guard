import { useCallback, useEffect, useRef } from 'react'
import { t } from '@/i18n'
import type { ContrastPreviewItem, ContrastPreviewResult, Violation } from '@/types'
import { ensureContentScriptReady, type AuditTargetTab } from '@/utils/audit-engine'

export type ContrastPreviewColors = Pick<
  NonNullable<Violation['userContrastOverride']>,
  'foregroundHex' | 'backgroundHex'
>

interface ContrastPreviewOptions {
  tab: AuditTargetTab | null
  /** Previews only make sense on the page the viewed audit came from. */
  isEnabled: boolean
  notify: { warning: (text: string) => void }
  sendToPage: (payload: Record<string, unknown>) => Promise<{ result?: unknown } | undefined>
}

function toPreviewItem(
  violation: Violation,
  colors: ContrastPreviewColors,
): ContrastPreviewItem | null {
  if (!violation.contrastDetails || !violation.elementSelector) return null
  return {
    id: violation.id,
    selector: violation.elementSelector,
    context: violation.contrastDetails.context,
    foregroundHex: colors.foregroundHex,
    backgroundHex: colors.backgroundHex,
  }
}

function countUnavailable(result: ContrastPreviewResult | null): number {
  return (result?.missing ?? 0) + (result?.unsupported ?? 0)
}

/**
 * Owns the colors the person tries out on the inspected page before saving a contrast override.
 * The page keeps them while a port to it stays open, so closing the panel restores the page.
 */
export function useContrastPreview({ tab, isEnabled, notify, sendToPage }: ContrastPreviewOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null)
  const itemsRef = useRef<Map<string, ContrastPreviewItem>>(new Map())
  const warnedItemRef = useRef<string | null>(null)

  const openSession = useCallback(async () => {
    if (portRef.current || !tab?.id) return
    await ensureContentScriptReady(tab.id, tab.url)
    const port = chrome.tabs.connect(tab.id, { name: 'contrast-preview-session' })
    port.onDisconnect.addListener(() => {
      if (portRef.current !== port) return
      portRef.current = null
      itemsRef.current.clear()
    })
    portRef.current = port
  }, [tab?.id, tab?.url])

  const sync = useCallback(
    async (items: ContrastPreviewItem[]) => {
      if (!isEnabled) return null
      await openSession()
      items.forEach((item) => itemsRef.current.set(item.id, item))

      const response = await sendToPage({
        action: 'SYNC_CONTRAST_PREVIEWS',
        previews: Array.from(itemsRef.current.values()),
      })
      return (response?.result as ContrastPreviewResult | undefined) ?? null
    },
    [isEnabled, openSession, sendToPage],
  )

  /** Tries colors on one violation, warning once if the page can no longer show it. */
  const preview = useCallback(
    async (violation: Violation, colors: ContrastPreviewColors) => {
      const item = toPreviewItem(violation, colors)
      if (!item || !isEnabled) return

      try {
        const result = await sync([item])
        if (countUnavailable(result) > 0 && warnedItemRef.current !== item.id) {
          warnedItemRef.current = item.id
          notify.warning(t('popup.messages.contrastPreviewUnavailable'))
        }
      } catch (error) {
        console.error('Erro ao aplicar prévia de contraste:', error)
      }
    },
    [isEnabled, notify, sync],
  )

  /** Applies the same colors to several violations, as a bulk override does. */
  const previewAll = useCallback(
    async (violations: Violation[], colors: ContrastPreviewColors) => {
      const items = violations
        .map((violation) => toPreviewItem(violation, colors))
        .filter((item): item is ContrastPreviewItem => item !== null)
      const unavailableCount = countUnavailable(await sync(items))
      if (unavailableCount > 0) {
        notify.warning(t('popup.messages.contrastPreviewPartial', { count: unavailableCount }))
      }
    },
    [notify, sync],
  )

  const clear = useCallback(async () => {
    itemsRef.current.clear()
    warnedItemRef.current = null
    const port = portRef.current
    portRef.current = null

    try {
      await sendToPage({ action: 'CLEAR_CONTRAST_PREVIEWS' })
    } catch {
      // Closing the port below also restores the page while the tab is still there.
    } finally {
      port?.disconnect()
    }
  }, [sendToPage])

  useEffect(
    () => () => {
      portRef.current?.disconnect()
      portRef.current = null
      itemsRef.current.clear()
    },
    [tab?.id],
  )

  return { preview, previewAll, clear }
}
