import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getAccessibleName, getVisibleText, isElementVisible } from '@/utils'

export const regionSemanticRule: Rule = {
  id: 'region-semantic',
  nbrReference: '5.4.1',
  name: t('rules.regions.regionSemantic.name'),
  description: t('rules.regions.regionSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const hasMain = Boolean(document.querySelector('main, [role="main"]'))

    if (!hasMain) {
      violations.push(
        createViolation(regionSemanticRule, {
          element: document.body,
          message: t('rules.regions.regionSemantic.missingMessage'),
          suggestion: t('rules.regions.regionSemantic.missingSuggestion'),
          remediationAdvice: t('rules.regions.regionSemantic.missingRemediation'),
          customIdPrefix: 'region-main',
        }),
      )
    }

    document.querySelectorAll('[role="main"]').forEach((element) => {
      if (element.tagName !== 'MAIN') {
        violations.push(
          createViolation(regionSemanticRule, {
            element: element as HTMLElement,
            message: t('rules.regions.regionSemantic.roleMessage'),
            suggestion: t('rules.regions.regionSemantic.roleSuggestion'),
            remediationAdvice: t('rules.regions.regionSemantic.roleRemediation'),
            customIdPrefix: 'region-role-main',
          }),
        )
      }
    })

    return violations
  },
}

export const uniqueRegionIdentificationRule: Rule = {
  id: 'unique-region-identification',
  nbrReference: '5.4.5',
  name: t('rules.regions.uniqueRegionIdentification.name'),
  description: t('rules.regions.uniqueRegionIdentification.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const selectors = [
      'nav',
      '[role="navigation"]',
      'aside',
      '[role="complementary"]',
      'section[aria-label], section[aria-labelledby]',
      'form[aria-label], form[aria-labelledby]',
      '[role="search"]',
    ]

    const seen = new Map<string, HTMLElement[]>()

    document.querySelectorAll<HTMLElement>(selectors.join(', ')).forEach((element) => {
      const key = `${element.tagName.toLowerCase()}::${getAccessibleName(element).trim().toLowerCase()}`
      if (!seen.has(key)) seen.set(key, [])
      seen.get(key)?.push(element)
    })

    seen.forEach((elements, key) => {
      const [, name] = key.split('::')
      if (elements.length > 1 && !name) {
        elements.forEach((element) => {
          violations.push(
            createViolation(uniqueRegionIdentificationRule, {
              element,
              message: t('rules.regions.uniqueRegionIdentification.message'),
              suggestion: t('rules.regions.uniqueRegionIdentification.suggestion'),
              remediationAdvice: t('rules.regions.uniqueRegionIdentification.remediation'),
              customIdPrefix: 'region-label',
            }),
          )
        })
      }
    })

    return violations
  },
}

export const contentInRegionsRule: Rule = {
  id: 'content-in-regions',
  nbrReference: '5.4.3',
  name: t('rules.regions.contentInRegions.name'),
  description: t('rules.regions.contentInRegions.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const structuralSelector =
      'main, header, footer, nav, aside, section, article, [role="main"], [role="banner"], [role="contentinfo"], [role="navigation"], [role="complementary"], [role="region"], [role="search"]'
    const candidates = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        isElementVisible(element) &&
        !element.matches(structuralSelector) &&
        !element.closest(structuralSelector) &&
        !element.querySelector(structuralSelector) &&
        getVisibleText(element).length >= 120,
    )

    return candidates.slice(0, 8).map((element) =>
      createViolation(contentInRegionsRule, {
        element,
        message: t('rules.regions.contentInRegions.message'),
        suggestion: t('rules.regions.contentInRegions.suggestion'),
        remediationAdvice: t('rules.regions.contentInRegions.remediation'),
        customIdPrefix: 'content-in-regions',
      }),
    )
  },
}

export const regionRules: Rule[] = [
  regionSemanticRule,
  contentInRegionsRule,
  uniqueRegionIdentificationRule,
]
