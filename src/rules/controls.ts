import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName, isElementVisible } from '@/utils';

export const buttonSemanticRule: Rule = {
  id: 'button-semantic',
  nbrReference: '5.8.1',
  name: 'Semântica de botão',
  description: 'Botões e controles de ação devem possuir semântica e nome acessível',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const controls = document.querySelectorAll<HTMLElement>('button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]');

    controls.forEach((control) => {
      if (!isElementVisible(control)) return;

      const name = getAccessibleName(control);
      if (!name.trim()) {
        violations.push(createViolation(buttonSemanticRule, {
          element: control,
          message: 'Controle com comportamento de botão sem nome acessível.',
          suggestion: 'Forneça texto visível, value ou aria-label descritivo.',
          remediationAdvice: `<button aria-label="Salvar alterações">Salvar</button>`,
          customIdPrefix: 'button-name',
        }));
      }
    });

    return violations;
  },
};

export const targetSizeRule: Rule = {
  id: 'target-size',
  nbrReference: '5.8.7',
  name: 'Área de acionamento mínima',
  description: 'Elementos acionáveis devem possuir área mínima para interação',
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const controls = document.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [role="button"], [role="link"]');

    controls.forEach((control) => {
      if (!isElementVisible(control)) return;
      if ((control as HTMLInputElement).type === 'hidden') return;

      const rect = control.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) {
        violations.push(createViolation(targetSizeRule, {
          element: control,
          message: `Área acionável muito pequena (${Math.round(rect.width)}x${Math.round(rect.height)}px).`,
          suggestion: 'Aumente a área clicável para pelo menos 24x24 px.',
          remediationAdvice: `button { min-width: 24px; min-height: 24px; }`,
          customIdPrefix: 'target-size',
        }));
      }
    });

    return violations;
  },
};

export const controlRules: Rule[] = [
  buttonSemanticRule,
  targetSizeRule,
];
