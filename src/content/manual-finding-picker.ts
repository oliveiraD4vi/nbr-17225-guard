import { t } from '@/i18n'
import type { ManualFindingElementDraft } from '@/types'
import { getAccessibleName } from '@/utils/accessible-name'
import { getElementSelector, isGuardInjectedElement } from '@/utils/element-identity'
import { getVisibleText } from '@/utils/visibility'
import { MANUAL_FINDING_SELECTION_HOST_ID } from '@/utils/manual-findings'
import { clearHighlights } from './violation-highlights'

const manualSelectionOverlayZIndex = '2147483647'
let manualSelectionHost: HTMLDivElement | null = null
let manualSelectionHoverBox: HTMLDivElement | null = null
let manualSelectionTarget: HTMLElement | null = null

export function startManualFindingSelection() {
  if (!document.body) {
    throw new Error(t('content.manualSelectionUnavailable'))
  }

  clearHighlights()
  stopManualFindingSelection()

  const host = document.createElement('div')
  host.id = MANUAL_FINDING_SELECTION_HOST_ID
  host.style.position = 'fixed'
  host.style.inset = '0'
  host.style.zIndex = manualSelectionOverlayZIndex
  host.style.pointerEvents = 'none'

  const shadowRoot = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = `
    :host {
      color-scheme: light;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .selection-instruction {
      position: fixed;
      top: 16px;
      left: 50%;
      max-width: min(560px, calc(100vw - 32px));
      transform: translateX(-50%);
      display: grid;
      gap: 4px;
      padding: 12px 16px;
      border-radius: 12px;
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
      pointer-events: none;
      text-align: center;
    }

    .selection-instruction strong {
      font-size: 14px;
      line-height: 1.35;
    }

    .selection-instruction span {
      color: rgba(255, 255, 255, 0.78);
      font-size: 12px;
      line-height: 1.45;
    }

    .selection-hover {
      position: fixed;
      display: none;
      border: 2px solid #2563eb;
      border-radius: 8px;
      background: rgba(37, 99, 235, 0.12);
      box-shadow:
        0 0 0 9999px rgba(15, 23, 42, 0.18),
        0 12px 30px rgba(37, 99, 235, 0.2);
      box-sizing: border-box;
      pointer-events: none;
    }
  `

  const instruction = document.createElement('div')
  instruction.className = 'selection-instruction'

  const title = document.createElement('strong')
  title.textContent = t('content.manualSelectionTitle')

  const description = document.createElement('span')
  description.textContent = t('content.manualSelectionDescription')

  const hoverBox = document.createElement('div')
  hoverBox.className = 'selection-hover'

  instruction.appendChild(title)
  instruction.appendChild(description)
  shadowRoot.appendChild(style)
  shadowRoot.appendChild(hoverBox)
  shadowRoot.appendChild(instruction)

  document.body.appendChild(host)
  manualSelectionHost = host
  manualSelectionHoverBox = hoverBox

  document.addEventListener('mousemove', handleManualFindingMouseMove, true)
  document.addEventListener('click', handleManualFindingClick, true)
  document.addEventListener('keydown', handleManualFindingKeydown, true)
  window.addEventListener('scroll', handleManualFindingViewportChange, true)
  window.addEventListener('resize', handleManualFindingViewportChange, true)
}

export function stopManualFindingSelection() {
  document.removeEventListener('mousemove', handleManualFindingMouseMove, true)
  document.removeEventListener('click', handleManualFindingClick, true)
  document.removeEventListener('keydown', handleManualFindingKeydown, true)
  window.removeEventListener('scroll', handleManualFindingViewportChange, true)
  window.removeEventListener('resize', handleManualFindingViewportChange, true)

  manualSelectionHost?.remove()
  manualSelectionHost = null
  manualSelectionHoverBox = null
  manualSelectionTarget = null
}

function handleManualFindingMouseMove(event: MouseEvent) {
  const target = getManualFindingSelectableElement(event.target)
  setManualFindingSelectionTarget(target)
}

function handleManualFindingClick(event: MouseEvent) {
  const target = manualSelectionTarget ?? getManualFindingSelectableElement(event.target)
  if (!target) return

  event.preventDefault()
  event.stopImmediatePropagation()

  const draft = createManualFindingDraft(target)
  stopManualFindingSelection()

  void chrome.runtime
    .sendMessage({
      action: 'STORE_MANUAL_FINDING_DRAFT',
      draft,
    })
    .catch((error: unknown) => {
      console.error('[Guardião NBR 17225] Erro ao salvar rascunho da violação manual:', error)
    })
}

function handleManualFindingKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return

  event.preventDefault()
  event.stopImmediatePropagation()
  stopManualFindingSelection()

  void chrome.runtime.sendMessage({ action: 'CLEAR_MANUAL_FINDING_DRAFT' }).catch(() => undefined)
}

function handleManualFindingViewportChange() {
  setManualFindingSelectionTarget(manualSelectionTarget)
}

function getManualFindingSelectableElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null

  let element: Element | null = target
  while (element && !(element instanceof HTMLElement)) {
    element = element.parentElement
  }

  if (!(element instanceof HTMLElement)) return null
  if (isGuardInjectedElement(element)) return null
  if (element === document.documentElement) return null

  return element
}

function setManualFindingSelectionTarget(target: HTMLElement | null) {
  manualSelectionTarget = target

  if (!manualSelectionHoverBox || !target) {
    if (manualSelectionHoverBox) manualSelectionHoverBox.style.display = 'none'
    return
  }

  const rect = target.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    manualSelectionHoverBox.style.display = 'none'
    return
  }

  manualSelectionHoverBox.style.display = 'block'
  manualSelectionHoverBox.style.left = `${rect.left}px`
  manualSelectionHoverBox.style.top = `${rect.top}px`
  manualSelectionHoverBox.style.width = `${rect.width}px`
  manualSelectionHoverBox.style.height = `${rect.height}px`
}

function compactManualFindingText(value: string, maxLength: number): string {
  const compacted = value.replace(/\s+/g, ' ').trim()
  if (compacted.length <= maxLength) return compacted
  return `${compacted.slice(0, maxLength - 1).trimEnd()}…`
}

function createManualFindingDraft(element: HTMLElement): ManualFindingElementDraft {
  return {
    ...createManualFindingElementSnapshot(element),
    url: window.location.href,
    pageTitle: document.title || undefined,
    selectedAt: Date.now(),
  }
}

function createManualFindingElementSnapshot(element: HTMLElement) {
  return {
    selector: getElementSelector(element),
    tagName: element.tagName.toLowerCase(),
    snippet: compactManualFindingText(
      element.outerHTML || `<${element.tagName.toLowerCase()}>`,
      500,
    ),
    accessibleName: compactManualFindingText(getAccessibleName(element), 300) || undefined,
    visibleText: compactManualFindingText(getVisibleText(element), 300) || undefined,
  }
}

export function resolveManualFindingSelectors(
  candidates: unknown,
): Array<ReturnType<typeof createManualFindingElementSnapshot> & { id: string }> {
  if (!Array.isArray(candidates)) return []

  return candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return []

    const { id, selector } = candidate as { id?: unknown; selector?: unknown }
    if (typeof id !== 'string' || typeof selector !== 'string' || !selector.trim()) return []

    try {
      const element = document.querySelector(selector)
      if (!(element instanceof HTMLElement) || isGuardInjectedElement(element)) return []

      return [{ id, ...createManualFindingElementSnapshot(element) }]
    } catch {
      // Selectors can come from an imported report; one this page cannot parse matches nothing.
      return []
    }
  })
}
