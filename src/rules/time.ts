import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const refreshControlRule: Rule = {
  id: 'refresh-control',
  nbrReference: '5.16.3',
  name: t('rules.time.refreshControl.name'),
  description: t('rules.time.refreshControl.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const metaRefresh = document.querySelector<HTMLMetaElement>('meta[http-equiv="refresh" i]');

    if (metaRefresh) {
      violations.push(createViolation(refreshControlRule, {
        element: metaRefresh as unknown as HTMLElement,
        message: t('rules.time.refreshControl.message'),
        suggestion: t('rules.time.refreshControl.suggestion'),
        remediationAdvice: t('rules.time.refreshControl.remediation'),
        customIdPrefix: 'meta-refresh',
      }));
    }

    return violations;
  },
};

export const timeRules: Rule[] = [refreshControlRule];
