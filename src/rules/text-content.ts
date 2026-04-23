import type { Rule, Violation } from '@/types';
import { createViolation, getVisibleText, isElementVisible } from '@/utils';

export const specialTextSemanticRule: Rule = {
  id: 'special-text-semantic',
  nbrReference: '5.12.8',
  name: 'Semântica de texto especial',
  description: 'Texto com ênfase ou significado especial deve usar elementos semânticos apropriados',
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
        message: `Elemento <${element.tagName.toLowerCase()}> usado para dar significado textual sem semântica apropriada.`,
        suggestion: 'Prefira <strong> para importância e <em> para ênfase.',
        remediationAdvice: `<strong>${text}</strong>`,
        customIdPrefix: 'special-text',
      }));
    });

    return violations;
  },
};

export const textContentRules: Rule[] = [specialTextSemanticRule];
