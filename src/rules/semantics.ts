import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getAccessibleName, isElementVisible } from '@/utils'

function isLikelyValidLanguageTag(value: string): boolean {
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value.trim())
}

export const pageTitleRule: Rule = {
  id: 'page-title',
  nbrReference: '5.13.1',
  name: t('rules.semantics.pageTitle.name'),
  description: t('rules.semantics.pageTitle.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    if (!document.title.trim()) {
      violations.push(
        createViolation(pageTitleRule, {
          element: document.body,
          message: t('rules.semantics.pageTitle.message'),
          suggestion: t('rules.semantics.pageTitle.suggestion'),
          remediationAdvice: t('rules.semantics.pageTitle.remediation'),
          customIdPrefix: 'page-title',
        }),
      )
    }
    return violations
  },
}

export const pageLanguageRule: Rule = {
  id: 'page-language',
  nbrReference: '5.13.2',
  name: t('rules.semantics.pageLanguage.name'),
  description: t('rules.semantics.pageLanguage.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const html = document.documentElement
    const lang = html.getAttribute('lang')
    if (!lang?.trim()) {
      violations.push(
        createViolation(pageLanguageRule, {
          element: html,
          message: t('rules.semantics.pageLanguage.message'),
          suggestion: t('rules.semantics.pageLanguage.suggestion'),
          remediationAdvice: t('rules.semantics.pageLanguage.remediation'),
          customIdPrefix: 'html-lang',
        }),
      )
    } else if (!isLikelyValidLanguageTag(lang)) {
      violations.push(
        createViolation(pageLanguageRule, {
          element: html,
          message: t('rules.semantics.pageLanguage.invalidMessage', { lang }),
          suggestion: t('rules.semantics.pageLanguage.suggestion'),
          remediationAdvice: t('rules.semantics.pageLanguage.remediation'),
          customIdPrefix: 'html-lang-invalid',
        }),
      )
    }
    return violations
  },
}

export const frameTitleRule: Rule = {
  id: 'frame-title',
  nbrReference: '5.13.4',
  name: t('rules.semantics.frameTitle.name'),
  description: t('rules.semantics.frameTitle.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    document.querySelectorAll<HTMLElement>('iframe, frame').forEach((frame) => {
      if (!isElementVisible(frame)) return
      if (!getAccessibleName(frame).trim()) {
        violations.push(
          createViolation(frameTitleRule, {
            element: frame,
            message: t('rules.semantics.frameTitle.message'),
            suggestion: t('rules.semantics.frameTitle.suggestion'),
            remediationAdvice: t('rules.semantics.frameTitle.remediation'),
            customIdPrefix: 'frame-title',
          }),
        )
      }
    })
    return violations
  },
}

export const zoomAllowedRule: Rule = {
  id: 'zoom-allowed',
  nbrReference: '5.13.5',
  name: t('rules.semantics.zoomAllowed.name'),
  description: t('rules.semantics.zoomAllowed.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    const content = viewport?.content.toLowerCase() || ''

    if (content.includes('user-scalable=no') || /maximum-scale\s*=\s*1(\.0)?/.test(content)) {
      violations.push(
        createViolation(zoomAllowedRule, {
          element: viewport as unknown as HTMLElement,
          message: t('rules.semantics.zoomAllowed.message'),
          suggestion: t('rules.semantics.zoomAllowed.suggestion'),
          remediationAdvice: t('rules.semantics.zoomAllowed.remediation'),
          customIdPrefix: 'zoom',
        }),
      )
    }

    return violations
  },
}

export const accessibleNameRule: Rule = {
  id: 'accessible-name',
  nbrReference: '5.13.10',
  name: t('rules.semantics.accessibleName.name'),
  description: t('rules.semantics.accessibleName.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const interactiveSelector = [
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
    ].join(', ')

    document.querySelectorAll<HTMLElement>(interactiveSelector).forEach((element) => {
      if (!isElementVisible(element)) return
      if (!getAccessibleName(element).trim()) {
        violations.push(
          createViolation(accessibleNameRule, {
            element,
            message: t('rules.semantics.accessibleName.message'),
            suggestion: t('rules.semantics.accessibleName.suggestion'),
            remediationAdvice: t('rules.semantics.accessibleName.remediation'),
            customIdPrefix: 'accessible-name',
          }),
        )
      }
    })

    return violations
  },
}

export const customStateRule: Rule = {
  id: 'custom-component-state',
  nbrReference: '5.13.13',
  name: t('rules.semantics.customState.name'),
  description: t('rules.semantics.customState.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const requiredStates: Record<string, string[]> = {
      checkbox: ['aria-checked'],
      radio: ['aria-checked'],
      switch: ['aria-checked'],
      slider: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
      combobox: ['aria-expanded'],
    }

    Object.entries(requiredStates).forEach(([role, attrs]) => {
      document.querySelectorAll<HTMLElement>(`[role="${role}"]`).forEach((element) => {
        const missing = attrs.filter((attr) => !element.hasAttribute(attr))
        if (missing.length) {
          violations.push(
            createViolation(customStateRule, {
              element,
              message: t('rules.semantics.customState.message', {
                role,
                attrs: missing.join(', '),
              }),
              suggestion: t('rules.semantics.customState.suggestion'),
              remediationAdvice: t('rules.semantics.customState.remediation', {
                role,
                attrsTemplate: attrs.map((attr) => `${attr}="..."`).join(' '),
              }),
              customIdPrefix: 'custom-state',
            }),
          )
        }
      })
    })

    return violations
  },
}

export const semanticRules: Rule[] = [
  pageTitleRule,
  pageLanguageRule,
  frameTitleRule,
  zoomAllowedRule,
  accessibleNameRule,
  customStateRule,
]
