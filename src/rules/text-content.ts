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

export const specialTextUsageRule: Rule = {
  id: 'special-text-usage',
  nbrReference: '5.12.9',
  name: 'Uso de texto especial',
  description: 'O uso de texto especial deve preservar o significado pretendido no contexto',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Não Automatizável',
  check: async (): Promise<Violation[]> => {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('strong, em, abbr, cite, mark, b, i'))
      .filter((element) => isElementVisible(element) && getVisibleText(element).trim());

    if (!candidates.length) return [];

    return [createViolation(specialTextUsageRule, {
      element: candidates[0],
      message: 'Texto especial detectado; a adequação semântica do uso exige revisão humana.',
      suggestion: 'Confirme se a marcação usada comunica corretamente importância, ênfase, abreviação, citação ou outro significado pretendido.',
      remediationAdvice: `Revise o contexto do texto especial e substitua marcação puramente visual por elemento semântico quando aplicável.`,
      customIdPrefix: 'special-text-usage',
    })];
  },
};

export const textContentRules: Rule[] = [specialTextSemanticRule, specialTextUsageRule];
