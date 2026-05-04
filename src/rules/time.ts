import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getVisibleText, isElementVisible } from '@/utils'

export const timeLimitRule: Rule = {
  id: 'time-limit',
  nbrReference: '5.16.1',
  name: t('rules.time.timeLimit.name'),
  description: t('rules.time.timeLimit.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []

    document
      .querySelectorAll<HTMLElement>(
        '[role="timer"], .timer, .countdown, .session-timeout, [data-timeout], [data-countdown]',
      )
      .forEach((element) => {
        if (!isElementVisible(element)) return
        const text = getVisibleText(element).toLowerCase()
        if (
          !/(tempo restante|segundos restantes|sess[aã]o expira|expira em|inatividade)/.test(text)
        )
          return

        violations.push(
          createViolation(timeLimitRule, {
            element,
            message: t('rules.time.timeLimit.timerMessage'),
            suggestion: t('rules.time.timeLimit.suggestion'),
            remediationAdvice: t('rules.time.timeLimit.remediation'),
            customIdPrefix: 'time-limit',
          }),
        )
      })

    return violations
  },
}

export const refreshControlRule: Rule = {
  id: 'refresh-control',
  nbrReference: '5.16.3',
  name: t('rules.time.refreshControl.name'),
  description: t('rules.time.refreshControl.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const metaRefresh = document.querySelector<HTMLMetaElement>('meta[http-equiv="refresh" i]')

    if (metaRefresh) {
      violations.push(
        createViolation(refreshControlRule, {
          element: metaRefresh as unknown as HTMLElement,
          message: t('rules.time.refreshControl.message'),
          suggestion: t('rules.time.refreshControl.suggestion'),
          remediationAdvice: t('rules.time.refreshControl.remediation'),
          customIdPrefix: 'meta-refresh',
        }),
      )
    }

    return violations
  },
}

export const timeRules: Rule[] = [timeLimitRule, refreshControlRule]
