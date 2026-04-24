import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const listSemanticRule: Rule = {
  id: 'list-semantic',
  nbrReference: '5.5.1',
  name: t('rules.lists.listSemantic.name'),
  description: t('rules.lists.listSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('li').forEach((item) => {
      if (!item.closest('ul, ol, menu')) {
        violations.push(createViolation(listSemanticRule, {
          element: item,
          message: t('rules.lists.listSemantic.itemMessage'),
          suggestion: t('rules.lists.listSemantic.itemSuggestion'),
          remediationAdvice: t('rules.lists.listSemantic.itemRemediation'),
          customIdPrefix: 'list-li',
        }));
      }
    });

    document.querySelectorAll<HTMLElement>('ul, ol').forEach((list) => {
      if (!list.querySelector('li')) {
        violations.push(createViolation(listSemanticRule, {
          element: list,
          message: t('rules.lists.listSemantic.emptyMessage'),
          suggestion: t('rules.lists.listSemantic.emptySuggestion'),
          remediationAdvice: t('rules.lists.listSemantic.emptyRemediation'),
          customIdPrefix: 'list-empty',
        }));
      }
    });

    return violations;
  },
};

export const listRules: Rule[] = [listSemanticRule];
