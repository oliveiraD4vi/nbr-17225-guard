import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const responsiveDesignRule: Rule = {
  id: 'responsive-design',
  nbrReference: '5.10.4',
  name: 'Design responsivo',
  description: 'Páginas devem declarar viewport adequada para responsividade',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

    if (!viewport) {
      violations.push(createViolation(responsiveDesignRule, {
        element: document.body,
        message: 'Meta viewport não encontrada.',
        suggestion: 'Adicione uma meta viewport adequada ao cabeçalho da página.',
        remediationAdvice: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
        customIdPrefix: 'viewport',
      }));
      return violations;
    }

    const content = viewport.content.toLowerCase();
    if (!content.includes('width=device-width')) {
      violations.push(createViolation(responsiveDesignRule, {
        element: viewport as unknown as HTMLElement,
        message: 'Meta viewport não define width=device-width.',
        suggestion: 'Use width=device-width para adaptação correta em telas pequenas.',
        remediationAdvice: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
        customIdPrefix: 'viewport-width',
      }));
    }

    return violations;
  },
};

export const presentationRules: Rule[] = [responsiveDesignRule];
