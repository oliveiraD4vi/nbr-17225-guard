import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName } from '@/utils';

export const regionSemanticRule: Rule = {
  id: 'region-semantic',
  nbrReference: '5.4.1',
  name: 'Semântica de região',
  description: 'A página deve expor regiões principais com semântica adequada',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const hasMain = !!document.querySelector('main, [role="main"]');

    if (!hasMain) {
      violations.push(createViolation(regionSemanticRule, {
        element: document.body,
        message: 'A página não possui uma região principal identificável.',
        suggestion: 'Adicione um elemento <main> ou role="main" para o conteúdo principal.',
        remediationAdvice: `<main>Conteúdo principal</main>`,
        customIdPrefix: 'region-main',
      }));
    }

    document.querySelectorAll('[role="main"]').forEach((element) => {
      if (element.tagName !== 'MAIN') {
        violations.push(createViolation(regionSemanticRule, {
          element: element as HTMLElement,
          message: 'Região principal foi criada com role em vez de elemento semântico.',
          suggestion: 'Prefira usar <main> para a região principal.',
          remediationAdvice: `<main>Conteúdo principal</main>`,
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
  name: 'Regiões identificadas unicamente',
  description: 'Regiões repetidas devem possuir nomes acessíveis distintos',
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
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)?.push(element);
    });

    seen.forEach((elements, key) => {
      const [, name] = key.split('::');
      if (elements.length > 1 && !name) {
        elements.forEach((element) => {
          violations.push(createViolation(uniqueRegionIdentificationRule, {
            element,
            message: 'Região repetida sem nome acessível para diferenciá-la das demais.',
            suggestion: 'Adicione aria-label ou aria-labelledby em regiões repetidas.',
            remediationAdvice: `<nav aria-label="Navegação principal">...</nav>`,
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
