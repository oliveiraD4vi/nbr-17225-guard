/**
 * Regras da Seção 5.11 - Uso de cores e contraste
 * ABNT NBR 17225:2025
 */

import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import {
  createViolation,
  getContrastRatio,
  getEffectiveBackgroundColor,
  isElementVisible,
  rgbToHex,
} from '@/utils'

function isTransparentColor(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return (
    !normalized ||
    normalized === 'transparent' ||
    normalized === 'none' ||
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(normalized)
  )
}

export const textContrastRule: Rule = {
  id: 'text-contrast',
  nbrReference: '5.11.3',
  name: t('rules.colors.textContrast.name'),
  description: t('rules.colors.textContrast.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const seenParents = new Set<HTMLElement>()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)

    let node
    while ((node = walker.nextNode())) {
      const textNode = node as Text
      const text = textNode.textContent?.trim()
      if (!text) continue

      const parent = textNode.parentElement
      if (!parent || !isElementVisible(parent) || seenParents.has(parent)) continue
      seenParents.add(parent)

      const textColor = window.getComputedStyle(parent).color
      const bgColor = getEffectiveBackgroundColor(parent)
      const textHex = rgbToHex(textColor)
      const bgHex = rgbToHex(bgColor)
      const ratio = getContrastRatio(textHex, bgHex)
      const fontSize = parseFloat(window.getComputedStyle(parent).fontSize)
      const fontWeight = window.getComputedStyle(parent).fontWeight
      const isLargeText =
        fontSize >= 18 ||
        (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700))
      const minRatio = isLargeText ? 3 : 4.5

      if (ratio < minRatio) {
        violations.push(
          createViolation(textContrastRule, {
            element: parent,
            description: t('rules.colors.textContrast.detail', {
              ratio: ratio.toFixed(2),
              minRatio,
            }),
            message: t('rules.colors.textContrast.message', { ratio: ratio.toFixed(2), minRatio }),
            suggestion: t('rules.colors.textContrast.suggestion'),
            remediationAdvice: t('rules.colors.textContrast.remediation', {
              ratio: ratio.toFixed(2),
              minRatio,
            }),
            contrastDetails: {
              context: 'text',
              foregroundHex: textHex,
              backgroundHex: bgHex,
              measuredRatio: ratio,
              minimumRatio: minRatio,
              foregroundLabel: t('contrast.foreground.text'),
              backgroundLabel: t('contrast.background.surface'),
            },
            customIdPrefix: 'contrast',
          }),
        )
      }
    }

    return violations
  },
}

export const componentContrastRule: Rule = {
  id: 'component-contrast',
  nbrReference: '5.11.4',
  name: t('rules.colors.componentContrast.name'),
  description: t('rules.colors.componentContrast.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const components = document.querySelectorAll('button, input, select, textarea, [role="button"]')

    components.forEach((component) => {
      if (!isElementVisible(component as HTMLElement)) return

      const el = component as HTMLElement
      const styles = window.getComputedStyle(el)
      const borderWidth = parseFloat(styles.borderWidth || '0')
      const borderColor = styles.borderColor
      const bgColor = styles.backgroundColor
      const surroundingColor = getEffectiveBackgroundColor((el.parentElement as HTMLElement) || el)

      if (borderWidth <= 0 || isTransparentColor(borderColor) || isTransparentColor(bgColor)) return

      const borderHex = rgbToHex(borderColor)
      const bgHex = rgbToHex(bgColor)
      const surroundingHex = rgbToHex(surroundingColor)
      const internalRatio = getContrastRatio(borderHex, bgHex)
      const externalRatio = getContrastRatio(borderHex, surroundingHex)
      const ratio = Math.max(internalRatio, externalRatio)

      if (ratio < 3) {
        violations.push(
          createViolation(componentContrastRule, {
            element: el,
            description: t('rules.colors.componentContrast.detail', { ratio: ratio.toFixed(2) }),
            message: t('rules.colors.componentContrast.message', {
              tagName: el.tagName,
              ratio: ratio.toFixed(2),
            }),
            suggestion: t('rules.colors.componentContrast.suggestion'),
            remediationAdvice: t('rules.colors.componentContrast.remediation', {
              ratio: ratio.toFixed(2),
            }),
            contrastDetails: {
              context: 'component',
              foregroundHex: borderHex,
              backgroundHex: bgHex,
              comparisonHex: surroundingHex,
              comparisonLabel: t('contrast.background.adjacent'),
              measuredRatio: ratio,
              minimumRatio: 3,
              foregroundLabel: t('contrast.foreground.border'),
              backgroundLabel: t('contrast.background.component'),
            },
            customIdPrefix: 'component-contrast',
          }),
        )
      }
    })

    return violations
  },
}

export const colorRules: Rule[] = [textContrastRule, componentContrastRule]
