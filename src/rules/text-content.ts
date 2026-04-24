import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation, getVisibleText, isElementVisible } from '@/utils';

export const specialTextSemanticRule: Rule = {
  id: 'special-text-semantic',
  nbrReference: '5.12.8',
  name: t('rules.textContent.specialTextSemantic.name'),
  description: t('rules.textContent.specialTextSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('b, i').forEach((element) => {
      if (!isElementVisible(element)) return;
      const text = getVisibleText(element);
      if (!text) return;

      violations.push(createViolation(specialTextSemanticRule, {
        element,
        message: t('rules.textContent.specialTextSemantic.message', {
          tagName: element.tagName.toLowerCase(),
        }),
        suggestion: t('rules.textContent.specialTextSemantic.suggestion'),
        remediationAdvice: t('rules.textContent.specialTextSemantic.remediation', { text }),
        customIdPrefix: 'special-text',
      }));
    });

    return violations;
  },
};

export const specialTextUsageRule: Rule = {
  id: 'special-text-usage',
  nbrReference: '5.12.9',
  name: t('rules.textContent.specialTextUsage.name'),
  description: t('rules.textContent.specialTextUsage.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Não Automatizável',
  check: async (): Promise<Violation[]> => {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('strong, em, abbr, cite, mark, b, i'))
      .filter((element) => isElementVisible(element) && getVisibleText(element).trim());

    if (!candidates.length) return [];

    return [createViolation(specialTextUsageRule, {
      element: candidates[0],
      message: t('rules.textContent.specialTextUsage.message'),
      suggestion: t('rules.textContent.specialTextUsage.suggestion'),
      remediationAdvice: t('rules.textContent.specialTextUsage.remediation'),
      customIdPrefix: 'special-text-usage',
    })];
  },
};

export const textContentRules: Rule[] = [specialTextSemanticRule, specialTextUsageRule];
