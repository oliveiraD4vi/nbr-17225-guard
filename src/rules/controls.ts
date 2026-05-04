import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getAccessibleName, isElementVisible } from '@/utils'

function isInlineTextLink(control: HTMLElement): boolean {
  if (control.tagName !== 'A') return false
  if (!control.closest('p, li, dd, dt, figcaption, small')) return false

  const display = window.getComputedStyle(control).display
  return display === 'inline' || display === 'inline-block'
}

export const buttonSemanticRule: Rule = {
  id: 'button-semantic',
  nbrReference: '5.8.1',
  name: t('rules.controls.buttonSemantic.name'),
  description: t('rules.controls.buttonSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const controls = document.querySelectorAll<HTMLElement>(
      'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
    )

    controls.forEach((control) => {
      if (!isElementVisible(control)) return
      const name = getAccessibleName(control)
      if (!name.trim()) {
        violations.push(
          createViolation(buttonSemanticRule, {
            element: control,
            message: t('rules.controls.buttonSemantic.message'),
            suggestion: t('rules.controls.buttonSemantic.suggestion'),
            remediationAdvice: t('rules.controls.buttonSemantic.remediation'),
            customIdPrefix: 'button-name',
          }),
        )
      }
    })

    return violations
  },
}

export const targetSizeRule: Rule = {
  id: 'target-size',
  nbrReference: '5.8.7',
  name: t('rules.controls.targetSize.name'),
  description: t('rules.controls.targetSize.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const controls = document.querySelectorAll<HTMLElement>(
      'a, button, input, select, textarea, [role="button"], [role="link"]',
    )

    controls.forEach((control) => {
      if (!isElementVisible(control)) return
      if ((control as HTMLInputElement).type === 'hidden') return
      if (isInlineTextLink(control)) return

      const rect = control.getBoundingClientRect()
      if (rect.width < 24 || rect.height < 24) {
        violations.push(
          createViolation(targetSizeRule, {
            element: control,
            message: t('rules.controls.targetSize.message', {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            }),
            suggestion: t('rules.controls.targetSize.suggestion'),
            remediationAdvice: t('rules.controls.targetSize.remediation'),
            customIdPrefix: 'target-size',
          }),
        )
      }
    })

    return violations
  },
}

export const controlRules: Rule[] = [buttonSemanticRule, targetSizeRule]
