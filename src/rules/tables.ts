import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName } from '@/utils';

export const tableSemanticRule: Rule = {
  id: 'table-semantic',
  nbrReference: '5.6.1',
  name: t('rules.tables.tableSemantic.name'),
  description: t('rules.tables.tableSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('td, th, tr').forEach((cell) => {
      if (!cell.closest('table')) {
        violations.push(createViolation(tableSemanticRule, {
          element: cell,
          message: t('rules.tables.tableSemantic.message', { tagName: cell.tagName.toLowerCase() }),
          suggestion: t('rules.tables.tableSemantic.suggestion'),
          remediationAdvice: t('rules.tables.tableSemantic.remediation'),
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
  name: t('rules.tables.tableHeaders.name'),
  description: t('rules.tables.tableHeaders.description'),
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
          message: t('rules.tables.tableHeaders.missingMessage'),
          suggestion: t('rules.tables.tableHeaders.missingSuggestion'),
          remediationAdvice: t('rules.tables.tableHeaders.missingRemediation'),
          customIdPrefix: 'table-th',
        }));
        return;
      }

      headers.forEach((header) => {
        if (!header.getAttribute('scope') && !header.getAttribute('id')) {
          violations.push(createViolation(tableHeadersRule, {
            element: header as HTMLElement,
            message: t('rules.tables.tableHeaders.associationMessage'),
            suggestion: t('rules.tables.tableHeaders.associationSuggestion'),
            remediationAdvice: t('rules.tables.tableHeaders.associationRemediation'),
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
  name: t('rules.tables.tableCaption.name'),
  description: t('rules.tables.tableCaption.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
      const hasData = table.querySelector('td, th');
      if (!hasData) return;

      const hasCaption = Boolean(table.querySelector('caption'));
      const accessibleName = getAccessibleName(table as unknown as HTMLElement);

      if (!hasCaption && !accessibleName) {
        violations.push(createViolation(tableCaptionRule, {
          element: table,
          message: t('rules.tables.tableCaption.message'),
          suggestion: t('rules.tables.tableCaption.suggestion'),
          remediationAdvice: t('rules.tables.tableCaption.remediation'),
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
