/**
 * Regras da Seção 5.2 - Imagens
 * ABNT NBR 17225:2025
 */

import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getAccessibleName, isElementVisible } from '@/utils'

export const imageAltTextRule: Rule = {
  id: 'image-alt-text',
  nbrReference: '5.2.1',
  name: t('rules.images.imageAltText.name'),
  description: t('rules.images.imageAltText.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!isElementVisible(img)) return
      const alt = img.getAttribute('alt')
      const ariaLabel = img.getAttribute('aria-label')
      const role = img.getAttribute('role')
      if (role === 'presentation' || role === 'none') return

      if (alt === null && (!ariaLabel || !ariaLabel.trim())) {
        violations.push(
          createViolation(imageAltTextRule, {
            element: img,
            message: t('rules.images.imageAltText.message'),
            suggestion: t('rules.images.imageAltText.suggestion'),
            remediationAdvice: t('rules.images.imageAltText.remediation'),
            customIdPrefix: 'image-alt',
          }),
        )
      }
    })

    return violations
  },
}

export const imageFunctionalAltRule: Rule = {
  id: 'image-functional-alt',
  nbrReference: '5.2.2',
  name: t('rules.images.imageFunctionalAlt.name'),
  description: t('rules.images.imageFunctionalAlt.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document.querySelectorAll<HTMLImageElement>('a img, button img').forEach((img) => {
      if (!isElementVisible(img)) return
      const alt = img.getAttribute('alt')
      const parentControl = img.closest<HTMLElement>('a, button')
      const parentName = parentControl ? getAccessibleName(parentControl).trim() : ''

      if ((!alt || !alt.trim()) && !parentName) {
        violations.push(
          createViolation(imageFunctionalAltRule, {
            element: img,
            message: t('rules.images.imageFunctionalAlt.message'),
            suggestion: t('rules.images.imageFunctionalAlt.suggestion'),
            remediationAdvice: t('rules.images.imageFunctionalAlt.remediation'),
            customIdPrefix: 'image-functional',
          }),
        )
      }
    })

    return violations
  },
}

export const imageDecorativeRule: Rule = {
  id: 'image-decorative',
  nbrReference: '5.2.3',
  name: t('rules.images.imageDecorative.name'),
  description: t('rules.images.imageDecorative.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!isElementVisible(img)) return
      const alt = img.getAttribute('alt')
      const role = img.getAttribute('role')
      const ariaHidden = img.getAttribute('aria-hidden')
      const className = img.className.toLowerCase()
      const isSmallAsset = img.width <= 48 && img.height <= 48

      const looksDecorative =
        isSmallAsset &&
        ['icon', 'decor', 'divider', 'spacer', 'background'].some((token) =>
          className.includes(token),
        )
      if (
        looksDecorative &&
        !(alt === '' || role === 'presentation' || role === 'none' || ariaHidden === 'true')
      ) {
        violations.push(
          createViolation(imageDecorativeRule, {
            element: img,
            message: t('rules.images.imageDecorative.message'),
            suggestion: t('rules.images.imageDecorative.suggestion'),
            remediationAdvice: t('rules.images.imageDecorative.remediation'),
            customIdPrefix: 'image-decorative',
          }),
        )
      }
    })

    return violations
  },
}

export const complexImageDescriptionRule: Rule = {
  id: 'complex-image-description',
  nbrReference: '5.2.4',
  name: t('rules.images.complexImageDescription.name'),
  description: t('rules.images.complexImageDescription.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!isElementVisible(img)) return
      const alt = img.getAttribute('alt') || ''
      const className = img.className.toLowerCase()
      const src = img.src.toLowerCase()
      const sufficientlyLarge = img.width >= 120 || img.height >= 120
      const looksComplex = ['chart', 'graph', 'map', 'diagram', 'infographic'].some(
        (token) =>
          className.includes(token) || src.includes(token) || alt.toLowerCase().includes(token),
      )
      const hasLongDescription = Boolean(
        img.getAttribute('longdesc') || img.getAttribute('aria-describedby'),
      )

      if (looksComplex && sufficientlyLarge && !hasLongDescription) {
        violations.push(
          createViolation(complexImageDescriptionRule, {
            element: img,
            message: t('rules.images.complexImageDescription.message'),
            suggestion: t('rules.images.complexImageDescription.suggestion'),
            remediationAdvice: t('rules.images.complexImageDescription.remediation'),
            customIdPrefix: 'image-complex',
          }),
        )
      }
    })

    return violations
  },
}

export const imageOfTextRule: Rule = {
  id: 'image-of-text',
  nbrReference: '5.2.5',
  name: t('rules.images.imageOfText.name'),
  description: t('rules.images.imageOfText.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!isElementVisible(img)) return
      const alt = (img.getAttribute('alt') || '').trim()
      const metadata = `${img.src} ${img.className} ${alt}`.toLowerCase()
      const looksLikeTextAsset =
        /\b(text|texto|title|titulo|headline|heading|banner|cta|button)\b/.test(metadata)

      if (looksLikeTextAsset && alt.length >= 12 && !img.closest('a, button')) {
        violations.push(
          createViolation(imageOfTextRule, {
            element: img,
            message: t('rules.images.imageOfText.message'),
            suggestion: t('rules.images.imageOfText.suggestion'),
            remediationAdvice: t('rules.images.imageOfText.remediation'),
            customIdPrefix: 'image-text',
          }),
        )
      }
    })

    return violations
  },
}

export const imageRules: Rule[] = [
  imageAltTextRule,
  imageFunctionalAltRule,
  imageDecorativeRule,
  complexImageDescriptionRule,
  imageOfTextRule,
]
