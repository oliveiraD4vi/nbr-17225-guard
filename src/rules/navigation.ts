import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName, isElementVisible } from '@/utils';

export const linkSemanticRule: Rule = {
  id: 'link-semantic',
  nbrReference: '5.7.1',
  name: t('rules.navigation.linkSemantic.name'),
  description: t('rules.navigation.linkSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLAnchorElement>('a').forEach((anchor) => {
      if (!isElementVisible(anchor)) return;

      const href = anchor.getAttribute('href');
      const name = getAccessibleName(anchor);

      if (!href || href.trim() === '') {
        violations.push(createViolation(linkSemanticRule, {
          element: anchor,
          message: t('rules.navigation.linkSemantic.hrefMessage'),
          suggestion: t('rules.navigation.linkSemantic.hrefSuggestion'),
          remediationAdvice: t('rules.navigation.linkSemantic.hrefRemediation'),
          customIdPrefix: 'link-href',
        }));
      }

      if (!name.trim()) {
        violations.push(createViolation(linkSemanticRule, {
          element: anchor,
          message: t('rules.navigation.linkSemantic.nameMessage'),
          suggestion: t('rules.navigation.linkSemantic.nameSuggestion'),
          remediationAdvice: t('rules.navigation.linkSemantic.nameRemediation'),
          customIdPrefix: 'link-name',
        }));
      }
    });

    return violations;
  },
};

export const skipLinksRule: Rule = {
  id: 'skip-links',
  nbrReference: '5.7.12',
  name: t('rules.navigation.skipLinks.name'),
  description: t('rules.navigation.skipLinks.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const skipLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).find((link) => {
      const text = getAccessibleName(link).toLowerCase();
      return text.includes('pular') || text.includes('conteúdo') || text.includes('conteudo');
    });

    if (!skipLink) {
      violations.push(createViolation(skipLinksRule, {
        element: document.body,
        message: t('rules.navigation.skipLinks.message'),
        suggestion: t('rules.navigation.skipLinks.suggestion'),
        remediationAdvice: t('rules.navigation.skipLinks.remediation'),
        customIdPrefix: 'skip-link',
      }));
    }

    return violations;
  },
};

export const navigationRules: Rule[] = [
  linkSemanticRule,
  skipLinksRule,
];
