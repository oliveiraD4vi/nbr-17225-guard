import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName } from '@/utils';

export const regionSemanticRule: Rule = {
  id: 'region-semantic',
  nbrReference: '5.4.1',
  name: t('rules.regions.regionSemantic.name'),
  description: t('rules.regions.regionSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const hasMain = Boolean(document.querySelector('main, [role="main"]'));

    if (!hasMain) {
      violations.push(createViolation(regionSemanticRule, {
        element: document.body,
        message: t('rules.regions.regionSemantic.missingMessage'),
        suggestion: t('rules.regions.regionSemantic.missingSuggestion'),
        remediationAdvice: t('rules.regions.regionSemantic.missingRemediation'),
        customIdPrefix: 'region-main',
      }));
    }

    document.querySelectorAll('[role="main"]').forEach((element) => {
      if (element.tagName !== 'MAIN') {
        violations.push(createViolation(regionSemanticRule, {
          element: element as HTMLElement,
          message: t('rules.regions.regionSemantic.roleMessage'),
          suggestion: t('rules.regions.regionSemantic.roleSuggestion'),
          remediationAdvice: t('rules.regions.regionSemantic.roleRemediation'),
          customIdPrefix: 'region-role-main',
        }));
      }
    });

    return violations;
  },
};

export const uniqueRegionIdentificationRule: Rule = {
  id: 'unique-region-identification',
  nbrReference: '5.4.5',
  name: t('rules.regions.uniqueRegionIdentification.name'),
  description: t('rules.regions.uniqueRegionIdentification.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const selectors = [
      'nav',
      '[role="navigation"]',
      'aside',
      '[role="complementary"]',
      'section[aria-label], section[aria-labelledby]',
      'form[aria-label], form[aria-labelledby]',
      '[role="search"]',
    ];

    const seen = new Map<string, HTMLElement[]>();

    document.querySelectorAll<HTMLElement>(selectors.join(', ')).forEach((element) => {
      const key = `${element.tagName.toLowerCase()}::${getAccessibleName(element).trim().toLowerCase()}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)?.push(element);
    });

    seen.forEach((elements, key) => {
      const [, name] = key.split('::');
      if (elements.length > 1 && !name) {
        elements.forEach((element) => {
          violations.push(createViolation(uniqueRegionIdentificationRule, {
            element,
            message: t('rules.regions.uniqueRegionIdentification.message'),
            suggestion: t('rules.regions.uniqueRegionIdentification.suggestion'),
            remediationAdvice: t('rules.regions.uniqueRegionIdentification.remediation'),
            customIdPrefix: 'region-label',
          }));
        });
      }
    });

    return violations;
  },
};

export const regionRules: Rule[] = [
  regionSemanticRule,
  uniqueRegionIdentificationRule,
];
