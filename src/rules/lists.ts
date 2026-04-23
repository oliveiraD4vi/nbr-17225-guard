import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const listSemanticRule: Rule = {
  id: 'list-semantic',
  nbrReference: '5.5.1',
  name: 'Semântica de lista',
  description: 'Listas devem usar estrutura semântica correta com ul, ol e li',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('li').forEach((item) => {
      if (!item.closest('ul, ol, menu')) {
        violations.push(createViolation(listSemanticRule, {
          element: item,
          message: 'Item de lista encontrado fora de ul, ol ou menu.',
          suggestion: 'Agrupe itens de lista dentro de um contêiner semântico.',
          remediationAdvice: `<ul>\n  <li>Item</li>\n</ul>`,
          customIdPrefix: 'list-li',
        }));
      }
    });

    document.querySelectorAll<HTMLElement>('ul, ol').forEach((list) => {
      if (!list.querySelector('li')) {
        violations.push(createViolation(listSemanticRule, {
          element: list,
          message: 'Lista sem nenhum item <li> identificado.',
          suggestion: 'Use elementos <li> para cada item da lista.',
          remediationAdvice: `<ol>\n  <li>Primeiro item</li>\n</ol>`,
          customIdPrefix: 'list-empty',
        }));
      }
    });

    return violations;
  },
};

export const listRules: Rule[] = [listSemanticRule];
