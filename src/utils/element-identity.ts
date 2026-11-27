import {
  MANUAL_FINDING_SELECTION_HOST_ID,
  MANUAL_FINDING_SELECTION_ID_PREFIX,
} from '@/utils/manual-findings'

const HIGHLIGHT_ID_PREFIX = 'nbr-highlight-'

const VISION_FILTER_HOST_ID = 'nbr-vision-filter-host'

/**
 * Lê o atributo id sem depender de propriedades nomeadas do DOM.
 * Campos com name="id" podem sobrescrever element.id em formulários.
 */
export function getElementIdAttribute(element: Element): string {
  return element.getAttribute('id')?.trim() ?? ''
}

/**
 * Obtém o seletor CSS de um elemento
 */
export function getElementSelector(element: HTMLElement): string {
  const ownId = getElementIdAttribute(element)
  if (ownId) return `#${CSS.escape(ownId)}`

  const names: string[] = []
  while (element.parentElement) {
    const currentId = getElementIdAttribute(element)
    if (currentId) {
      names.unshift(`#${CSS.escape(currentId)}`)
      break
    } else {
      if (element === element.ownerDocument.documentElement) {
        names.unshift(element.tagName.toLowerCase())
      } else {
        let index = 1
        let sibling = element.previousElementSibling

        while (sibling) {
          if (sibling.tagName === element.tagName) {
            index += 1
          }
          sibling = sibling.previousElementSibling
        }

        names.unshift(`${element.tagName.toLowerCase()}:nth-of-type(${index})`)
      }
      element = element.parentElement
    }
  }
  return names.join(' > ')
}

export function isGuardInjectedElement(element: Element | null): boolean {
  if (!element) return false
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false

  const ownId = getElementIdAttribute(element)
  if (
    ownId === VISION_FILTER_HOST_ID ||
    ownId === MANUAL_FINDING_SELECTION_HOST_ID ||
    ownId.startsWith(HIGHLIGHT_ID_PREFIX) ||
    ownId.startsWith(MANUAL_FINDING_SELECTION_ID_PREFIX)
  ) {
    return true
  }

  return !!element.closest?.(
    `#${VISION_FILTER_HOST_ID}, #${MANUAL_FINDING_SELECTION_HOST_ID}, [id^="${HIGHLIGHT_ID_PREFIX}"], [id^="${MANUAL_FINDING_SELECTION_ID_PREFIX}"]`,
  )
}
