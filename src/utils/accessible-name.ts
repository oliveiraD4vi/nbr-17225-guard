import { getVisibleText, nonRenderableTags } from '@/utils/visibility'

const namedByAuthorSelector = [
  'table',
  'nav',
  'main',
  'aside',
  'header',
  'footer',
  'section',
  'article',
  'form',
  'ul',
  'ol',
  'fieldset',
  'figure',
  'dialog',
  ...[
    'table',
    'grid',
    'treegrid',
    'navigation',
    'main',
    'complementary',
    'banner',
    'contentinfo',
    'region',
    'search',
    'form',
    'list',
    'group',
    'dialog',
    'alertdialog',
    'figure',
    'article',
  ].map((role) => `[role="${role}"]`),
].join(', ')

export function getAccessibleName(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel?.trim()) return ariaLabel.trim()

  const labelledByText = getLabelledByText(element)
  if (labelledByText) return labelledByText

  if (element instanceof HTMLInputElement) {
    if (element.labels?.length) {
      const text = Array.from(element.labels)
        .map((label) => getVisibleText(label) || label.textContent?.trim() || '')
        .join(' ')
        .trim()
      if (text) return text
    }

    if (['button', 'submit', 'reset'].includes(element.type) && element.value?.trim()) {
      return element.value.trim()
    }

    if (element.placeholder?.trim()) return element.placeholder.trim()
  }

  if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    if (element.labels?.length) {
      const text = Array.from(element.labels)
        .map((label) => getVisibleText(label) || label.textContent?.trim() || '')
        .join(' ')
        .trim()
      if (text) return text
    }
  }

  const alt = element.getAttribute('alt')
  if (alt?.trim()) return alt.trim()

  const title = element.getAttribute('title')
  if (title?.trim()) return title.trim()

  // Landmarks, tables, lists, groups and dialogs are never named by their content (WAI-ARIA
  // "name from author"); only a native caption names them.
  if (element.matches(namedByAuthorSelector)) {
    const caption = element.querySelector<HTMLElement>(
      ':scope > caption, :scope > legend, :scope > figcaption',
    )
    return caption ? getVisibleText(caption) : ''
  }

  const visibleText = getVisibleText(element)
  if (visibleText) return visibleText

  // Controls can be named by text that is only visually hidden (a screen-reader-only label).
  if (element.matches('button, a, [role="button"], [role="link"], [role="tab"]')) {
    return getTextExposedToAssistiveTechnology(element).replace(/\s+/g, ' ').trim()
  }

  return ''
}

function getTextExposedToAssistiveTechnology(element: Element): string {
  if (
    element instanceof HTMLElement &&
    (element.hidden || nonRenderableTags.has(element.tagName))
  ) {
    return ''
  }
  if (element.getAttribute('aria-hidden') === 'true') return ''
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') return ''

  return Array.from(element.childNodes)
    .map((node) =>
      node.nodeType === Node.TEXT_NODE
        ? (node.textContent ?? '')
        : node instanceof Element
          ? getTextExposedToAssistiveTechnology(node)
          : '',
    )
    .join('')
}

export function getLabelledByText(element: Element): string {
  const labelledBy = element.getAttribute('aria-labelledby')
  if (!labelledBy) return ''

  return labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() || '')
    .filter(Boolean)
    .join(' ')
    .trim()
}

export function getAssociatedLabelText(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): string {
  if (element.labels?.length) {
    return Array.from(element.labels)
      .map((label) => getVisibleText(label) || label.textContent?.trim() || '')
      .join(' ')
      .trim()
  }

  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel?.trim()) return ariaLabel.trim()

  return getLabelledByText(element)
}

export function getAssociatedDescriptionText(element: HTMLElement): string {
  const describedBy = element.getAttribute('aria-describedby')
  if (!describedBy) return ''

  return describedBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() || '')
    .filter(Boolean)
    .join(' ')
    .trim()
}

export function getElementLanguage(element: HTMLElement): string {
  return (
    element.getAttribute('lang') ||
    element.closest<HTMLElement>('[lang]')?.getAttribute('lang') ||
    ''
  )
}
