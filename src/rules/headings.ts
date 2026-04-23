/**
 * Regras da Secao 5.3 - Cabecalhos
 * ABNT NBR 17225:2025
 */

import type { Rule, Violation } from '@/types';
import { createViolation, getVisibleText } from '@/utils';

export const headingSemanticRule: Rule = {
  id: 'heading-semantic',
  nbrReference: '5.3.1',
  name: 'Semântica de cabeçalho',
  description: 'Cabeçalhos devem usar tags semânticas h1-h6',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    if (document.querySelectorAll('h1').length === 0) {
      violations.push(createViolation(headingSemanticRule, {
        element: document.body,
        message: 'Página sem cabeçalho h1.',
        suggestion: 'Adicione um h1 como título principal.',
        remediationAdvice: `<h1>Título principal</h1>`,
        customIdPrefix: 'heading-h1',
      }));
    }
    return violations;
  },
};

export const headingUsageRule: Rule = {
  id: 'heading-usage',
  nbrReference: '5.3.2',
  name: 'Uso de cabeçalhos',
  description: 'Cabeçalhos devem representar seções reais do conteúdo',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const next = heading.nextElementSibling as HTMLElement | null;
      const nextText = next ? getVisibleText(next) : '';
      if (!next || (!nextText && !next.querySelector('img, ul, ol, table, section, article'))) {
        violations.push(createViolation(headingUsageRule, {
          element: heading,
          message: 'Cabeçalho sem conteúdo subsequente claramente associado.',
          suggestion: 'Verifique se o cabeçalho realmente introduz uma seção de conteúdo.',
          remediationAdvice: `<h2>Informações do evento</h2>\n<p>Descrição da seção.</p>`,
          customIdPrefix: 'heading-usage',
        }));
      }
    });
    return violations;
  },
};

export const headingStructureRule: Rule = {
  id: 'heading-structure',
  nbrReference: '5.3.5',
  name: 'Estrutura de cabeçalhos',
  description: 'Cabeçalhos devem manter hierarquia lógica',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const headings = document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');

    if (!headings.length) return violations;

    if (headings[0].tagName !== 'H1') {
      violations.push(createViolation(headingStructureRule, {
        element: headings[0],
        message: `Primeiro cabeçalho é ${headings[0].tagName.toLowerCase()} em vez de h1.`,
        suggestion: 'Inicie a hierarquia de cabeçalhos com h1.',
        remediationAdvice: `<h1>Título principal</h1>`,
        customIdPrefix: 'heading-first',
      }));
    }

    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = Number(heading.tagName[1]);
      if (lastLevel > 0 && level > lastLevel + 1) {
        violations.push(createViolation(headingStructureRule, {
          element: heading,
          message: `Salto na hierarquia de cabeçalhos: h${lastLevel} para h${level}.`,
          suggestion: 'Não pule níveis na estrutura de cabeçalhos.',
          remediationAdvice: `<h2>Seção</h2>\n<h3>Subseção</h3>`,
          customIdPrefix: 'heading-hierarchy',
        }));
      }
      lastLevel = level;
    });

    return violations;
  },
};

export const headingRules: Rule[] = [
  headingSemanticRule,
  headingUsageRule,
  headingStructureRule,
];
