import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName } from '@/utils';

export const tableSemanticRule: Rule = {
  id: 'table-semantic',
  nbrReference: '5.6.1',
  name: 'Semântica de tabela',
  description: 'Tabelas de dados devem usar elementos semânticos adequados',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('td, th, tr').forEach((cell) => {
      if (!cell.closest('table')) {
        violations.push(createViolation(tableSemanticRule, {
          element: cell,
          message: `Elemento ${cell.tagName.toLowerCase()} encontrado fora de uma tabela.`,
          suggestion: 'Use estrutura semântica completa de tabela ao utilizar células e linhas.',
          remediationAdvice: `<table>\n  <tr><th>Cabeçalho</th></tr>\n</table>`,
          customIdPrefix: 'table-structure',
        }));
      }
    });

    return violations;
  },
};

export const tableHeadersRule: Rule = {
  id: 'table-headers',
  nbrReference: '5.6.3',
  name: 'Cabeçalhos de tabela',
  description: 'Tabelas de dados devem possuir cabeçalhos identificáveis',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
      const cells = table.querySelectorAll('td');
      if (cells.length === 0) return;

      const headers = table.querySelectorAll('th');
      if (headers.length === 0) {
        violations.push(createViolation(tableHeadersRule, {
          element: table,
          message: 'Tabela de dados sem células de cabeçalho <th>.',
          suggestion: 'Adicione cabeçalhos de coluna ou linha usando <th>.',
          remediationAdvice: `<table>\n  <tr><th scope="col">Nome</th></tr>\n</table>`,
          customIdPrefix: 'table-th',
        }));
        return;
      }

      headers.forEach((header) => {
        if (!header.getAttribute('scope') && !header.getAttribute('id')) {
          violations.push(createViolation(tableHeadersRule, {
            element: header as HTMLElement,
            message: 'Cabeçalho de tabela sem scope ou id para associação explícita.',
            suggestion: 'Defina scope="col"/"row" ou use id com headers nas células.',
            remediationAdvice: `<th scope="col">Tempo</th>`,
            customIdPrefix: 'table-scope',
          }));
        }
      });
    });

    return violations;
  },
};

export const tableCaptionRule: Rule = {
  id: 'table-caption',
  nbrReference: '5.6.5',
  name: 'Título de tabela associado',
  description: 'Tabelas devem possuir caption ou nome acessível associado',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
      const hasData = table.querySelector('td, th');
      if (!hasData) return;

      const hasCaption = !!table.querySelector('caption');
      const accessibleName = getAccessibleName(table as unknown as HTMLElement);

      if (!hasCaption && !accessibleName) {
        violations.push(createViolation(tableCaptionRule, {
          element: table,
          message: 'Tabela sem caption ou nome acessível associado.',
          suggestion: 'Adicione <caption> ou aria-label/aria-labelledby na tabela.',
          remediationAdvice: `<table>\n  <caption>Resultados da prova</caption>\n</table>`,
          customIdPrefix: 'table-caption',
        }));
      }
    });

    return violations;
  },
};

export const tableRules: Rule[] = [
  tableSemanticRule,
  tableHeadersRule,
  tableCaptionRule,
];
