import { t } from '@/i18n'
import { clearContrastPreviews, syncContrastPreviews } from './content/contrast-preview-session'
import {
  resolveManualFindingSelectors,
  startManualFindingSelection,
  stopManualFindingSelection,
} from './content/manual-finding-picker'
import { runAuditInPage } from './content/page-audit'
import { capturePageAuditContext } from './content/page-context'
import {
  clearHighlights,
  highlightAllViolations,
  highlightViolation,
} from './content/violation-highlights'
import { applyVisionFilter } from './content/vision-filter'

const contentScope = globalThis as typeof globalThis & {
  __nbrGuardContentLoaded?: boolean
}

// The script is injected again on each audit; listeners must be registered only once per page.
if (!contentScope.__nbrGuardContentLoaded) {
  contentScope.__nbrGuardContentLoaded = true

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'contrast-preview-session') return
    port.onDisconnect.addListener(clearContrastPreviews)
  })

  window.addEventListener('pagehide', clearContrastPreviews)

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'PING':
        sendResponse({ status: 'OK' })
        break

      case 'RUN_AUDIT':
        runAuditInPage(
          Boolean(request.includeRecommendations),
          request.includeHumanReview !== false,
          request.auditScope === 'site' || request.auditScope === 'journey'
            ? request.auditScope
            : 'page',
        )
          .then((result) => sendResponse({ result }))
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : t('content.unknownAuditError')
            sendResponse({ error: message })
          })
        return true

      case 'CAPTURE_AUDIT_CONTEXT':
        sendResponse({ status: 'OK', context: capturePageAuditContext() })
        break

      case 'HIGHLIGHT_ALL_VIOLATIONS':
        highlightAllViolations(request.violations)
        sendResponse({ status: 'OK' })
        break

      case 'HIGHLIGHT_VIOLATION':
        highlightViolation(request.violation)
        sendResponse({ status: 'OK' })
        break

      case 'CLEAR_HIGHLIGHTS':
        clearHighlights()
        sendResponse({ status: 'OK' })
        break

      case 'SYNC_CONTRAST_PREVIEWS':
        sendResponse({ status: 'OK', result: syncContrastPreviews(request.previews) })
        break

      case 'CLEAR_CONTRAST_PREVIEWS':
        clearContrastPreviews()
        sendResponse({ status: 'OK' })
        break

      case 'APPLY_VISION_FILTER':
        applyVisionFilter(request.filter)
        sendResponse({ status: 'OK' })
        break

      case 'START_MANUAL_FINDING_SELECTION':
        try {
          startManualFindingSelection()
          sendResponse({ status: 'OK' })
        } catch (error) {
          const message = error instanceof Error ? error.message : t('content.manualSelectionError')
          sendResponse({ error: message })
        }
        break

      case 'CANCEL_MANUAL_FINDING_SELECTION':
        stopManualFindingSelection()
        sendResponse({ status: 'OK' })
        break

      case 'RESOLVE_MANUAL_FINDING_SELECTORS':
        sendResponse({
          status: 'OK',
          resolved: resolveManualFindingSelectors(request.candidates),
        })
        break

      default:
        sendResponse({ status: 'UNKNOWN_ACTION' })
    }

    return true
  })
}
