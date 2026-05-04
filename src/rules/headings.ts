/**
 * Regras da Seção 5.3 - Cabeçalhos
 * ABNT NBR 17225:2025
 */

import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getVisibleText } from '@/utils'

export const headingSemanticRule: Rule = {
  id: 'heading-semantic',
  nbrReference: '5.3.1',
  name: t('rules.headings.headingSemantic.name'),
  description: t('rules.headings.headingSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    if (document.querySelectorAll('h1').length === 0) {
      violations.push(
        createViolation(headingSemanticRule, {
          element: document.body,
          message: t('rules.headings.headingSemantic.message'),
          suggestion: t('rules.headings.headingSemantic.suggestion'),
          remediationAdvice: t('rules.headings.headingSemantic.remediation'),
          customIdPrefix: 'heading-h1',
        }),
      )
    }

    return violations
  },
}

export const headingUsageRule: Rule = {
  id: 'heading-usage',
  nbrReference: '5.3.2',
  name: t('rules.headings.headingUsage.name'),
  description: t('rules.headings.headingUsage.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const next = heading.nextElementSibling as HTMLElement | null
      const nextText = next ? getVisibleText(next) : ''
      if (!next || (!nextText && !next.querySelector('img, ul, ol, table, section, article'))) {
        violations.push(
          createViolation(headingUsageRule, {
            element: heading,
            message: t('rules.headings.headingUsage.message'),
            suggestion: t('rules.headings.headingUsage.suggestion'),
            remediationAdvice: t('rules.headings.headingUsage.remediation'),
            customIdPrefix: 'heading-usage',
          }),
        )
      }
    })

    return violations
  },
}

export const mainHeadingRecommendationRule: Rule = {
  id: 'main-heading-recommendation',
  nbrReference: '5.3.3',
  name: t('rules.headings.mainHeadingRecommendation.name'),
  description: t('rules.headings.mainHeadingRecommendation.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const headings = Array.from(document.querySelectorAll<HTMLElement>('h1'))
    const visibleHeadings = headings.filter((heading) => getVisibleText(heading).trim())

    if (visibleHeadings.length <= 1) return []

    return visibleHeadings.slice(1).map((heading) =>
      createViolation(mainHeadingRecommendationRule, {
        element: heading,
        message: t('rules.headings.mainHeadingRecommendation.message'),
        suggestion: t('rules.headings.mainHeadingRecommendation.suggestion'),
        remediationAdvice: t('rules.headings.mainHeadingRecommendation.remediation'),
        customIdPrefix: 'main-heading-recommendation',
      }),
    )
  },
}

export const headingStructureRule: Rule = {
  id: 'heading-structure',
  nbrReference: '5.3.5',
  name: t('rules.headings.headingStructure.name'),
  description: t('rules.headings.headingStructure.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const headings = document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')

    if (!headings.length) return violations

    if (headings[0].tagName !== 'H1') {
      violations.push(
        createViolation(headingStructureRule, {
          element: headings[0],
          message: t('rules.headings.headingStructure.firstMessage', {
            tagName: headings[0].tagName.toLowerCase(),
          }),
          suggestion: t('rules.headings.headingStructure.firstSuggestion'),
          remediationAdvice: t('rules.headings.headingStructure.firstRemediation'),
          customIdPrefix: 'heading-first',
        }),
      )
    }

    let lastLevel = 0
    headings.forEach((heading) => {
      const level = Number(heading.tagName[1])
      if (lastLevel > 0 && level > lastLevel + 1) {
        violations.push(
          createViolation(headingStructureRule, {
            element: heading,
            message: t('rules.headings.headingStructure.jumpMessage', {
              from: lastLevel,
              to: level,
            }),
            suggestion: t('rules.headings.headingStructure.jumpSuggestion'),
            remediationAdvice: t('rules.headings.headingStructure.jumpRemediation'),
            customIdPrefix: 'heading-hierarchy',
          }),
        )
      }
      lastLevel = level
    })

    return violations
  },
}

export const headingRules: Rule[] = [
  headingSemanticRule,
  headingUsageRule,
  mainHeadingRecommendationRule,
  headingStructureRule,
]
