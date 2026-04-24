import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const responsiveDesignRule: Rule = {
  id: 'responsive-design',
  nbrReference: '5.10.4',
  name: t('rules.presentation.responsiveDesign.name'),
  description: t('rules.presentation.responsiveDesign.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

    if (!viewport) {
      violations.push(createViolation(responsiveDesignRule, {
        element: document.body,
        message: t('rules.presentation.responsiveDesign.missingMessage'),
        suggestion: t('rules.presentation.responsiveDesign.missingSuggestion'),
        remediationAdvice: t('rules.presentation.responsiveDesign.missingRemediation'),
        customIdPrefix: 'viewport',
      }));
      return violations;
    }

    const content = viewport.content.toLowerCase();
    if (!content.includes('width=device-width')) {
      violations.push(createViolation(responsiveDesignRule, {
        element: viewport as unknown as HTMLElement,
        message: t('rules.presentation.responsiveDesign.widthMessage'),
        suggestion: t('rules.presentation.responsiveDesign.widthSuggestion'),
        remediationAdvice: t('rules.presentation.responsiveDesign.widthRemediation'),
        customIdPrefix: 'viewport-width',
      }));
    }

    return violations;
  },
};

export const presentationRules: Rule[] = [responsiveDesignRule];
