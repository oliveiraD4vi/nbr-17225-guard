import { isGuardInjectedElement } from '@/utils/element-identity'

const visuallyHiddenClassPattern =
  /\b(sr-only|screen-reader|screenreader|visually-hidden|hidden-visually|a11y-hidden)\b/i

export const nonRenderableTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD'])

/**
 * Verifica se um elemento está visível
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false
  if (isGuardInjectedElement(element)) return false

  let current: HTMLElement | null = element
  while (current && current !== document.documentElement) {
    if (isGuardInjectedElement(current)) return false
    if (current.hidden || current.getAttribute('aria-hidden') === 'true') return false
    if (nonRenderableTags.has(current.tagName)) return false

    const style = window.getComputedStyle(current)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number.parseFloat(style.opacity || '1') <= 0.01
    ) {
      return false
    }

    current = current.parentElement
  }

  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

export function isElementPerceptiblyVisible(element: HTMLElement): boolean {
  if (!isElementVisible(element)) return false

  let current: HTMLElement | null = element
  while (current && current !== document.documentElement) {
    const className =
      typeof current.className === 'string'
        ? current.className
        : current.getAttribute('class') || ''
    if (visuallyHiddenClassPattern.test(className)) return false

    const style = window.getComputedStyle(current)
    const rect = current.getBoundingClientRect()
    const clipValue = style.clip || ''
    const clipPathValue = style.clipPath || ''
    const isClipped =
      (!!clipValue && clipValue !== 'auto') ||
      (!!clipPathValue && clipPathValue !== 'none') ||
      (style.overflow === 'hidden' && rect.width <= 2 && rect.height <= 2)

    if (isClipped && rect.width <= 2 && rect.height <= 2) return false

    current = current.parentElement
  }

  const rect = element.getBoundingClientRect()
  if (rect.width <= 1 || rect.height <= 1) return false

  return true
}

/**
 * Obtém o texto visível de um elemento
 */
export function getVisibleText(element: HTMLElement): string {
  if (!element) return ''
  if (isGuardInjectedElement(element)) return ''
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return ''
  if (nonRenderableTags.has(element.tagName)) return ''

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return ''
  if (!isElementPerceptiblyVisible(element)) return ''

  let text = ''
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node instanceof HTMLElement) {
        text += getVisibleText(node)
      }
    }
  }

  return text.trim()
}

export function getFocusableElements(root: ParentNode = document): HTMLElement[] {
  const selector = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'summary',
    'iframe',
    '[tabindex]',
    '[contenteditable="true"]',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
  ].join(', ')

  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    if (!isElementVisible(element)) return false
    const tabIndex = element.getAttribute('tabindex')
    return tabIndex === null || Number(tabIndex) >= 0
  })
}

export function isElementFullyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  )
}

export function isElementPartiallyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  )
}
