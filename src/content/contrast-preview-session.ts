import type { ContrastPreviewItem, ContrastPreviewResult } from '@/types'
import { rgbToHex } from '@/utils/color-contrast'
import { isGuardInjectedElement } from '@/utils/element-identity'
import {
  applyInlinePreviewStyle,
  captureInlineStyle,
  getContrastPreviewProperties,
  type InlineStyleSnapshot,
  restoreInlineStyle,
} from '@/utils/contrast-preview'

const contrastPreviewOriginalStyles = new Map<HTMLElement, Map<string, InlineStyleSnapshot>>()

function rememberContrastPreviewStyle(element: HTMLElement, property: string) {
  let originalStyles = contrastPreviewOriginalStyles.get(element)
  if (!originalStyles) {
    originalStyles = new Map()
    contrastPreviewOriginalStyles.set(element, originalStyles)
  }
  if (originalStyles.has(property)) return

  originalStyles.set(property, captureInlineStyle(element.style, property))
}

function setContrastPreviewStyle(element: HTMLElement, property: string, value: string) {
  rememberContrastPreviewStyle(element, property)
  applyInlinePreviewStyle(element.style, property, value)
}

function getGraphicForegroundProperty(element: HTMLElement, expectedHex: string): string | null {
  const style = window.getComputedStyle(element)
  const properties = ['fill', 'stroke', 'color'] as const
  const normalizedExpected = expectedHex.toLowerCase()

  const exactProperty = properties.find((property) => {
    const value = style.getPropertyValue(property)
    if (!value || value === 'none' || value === 'transparent') return false
    return rgbToHex(value).toLowerCase() === normalizedExpected
  })
  if (exactProperty) return exactProperty

  return (
    properties.find((property) => {
      const value = style.getPropertyValue(property)
      return Boolean(value && value !== 'none' && value !== 'transparent')
    }) ?? null
  )
}

function applyContrastPreview(element: HTMLElement, preview: ContrastPreviewItem): boolean {
  if (isGuardInjectedElement(element)) return false

  const graphicProperty =
    preview.context === 'graphic'
      ? getGraphicForegroundProperty(element, preview.foregroundHex)
      : undefined
  const properties = getContrastPreviewProperties(preview.context, graphicProperty)
  if (!properties) return false

  setContrastPreviewStyle(element, properties.foreground, preview.foregroundHex)
  setContrastPreviewStyle(element, properties.background, preview.backgroundHex)
  return true
}

export function syncContrastPreviews(
  previews: ContrastPreviewItem[] | undefined,
): ContrastPreviewResult {
  clearContrastPreviews()
  const result: ContrastPreviewResult = { applied: 0, missing: 0, unsupported: 0 }

  for (const preview of previews ?? []) {
    if (!preview?.selector) {
      result.missing += 1
      continue
    }

    let element: HTMLElement | null = null
    try {
      element = document.querySelector<HTMLElement>(preview.selector)
    } catch {
      // Selectors can come from an imported report; one this page cannot parse matches nothing.
      result.missing += 1
      continue
    }

    if (!element) {
      result.missing += 1
      continue
    }

    if (applyContrastPreview(element, preview)) result.applied += 1
    else result.unsupported += 1
  }

  return result
}

export function clearContrastPreviews() {
  contrastPreviewOriginalStyles.forEach((properties, element) => {
    properties.forEach((original, property) => {
      restoreInlineStyle(element.style, property, original)
    })
  })
  contrastPreviewOriginalStyles.clear()
}
