import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation, getAssociatedLabelText, isElementVisible } from '@/utils';

const formFieldsSelector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea';

export const fieldLabelRule: Rule = {
  id: 'field-label',
  nbrReference: '5.9.1',
  name: t('rules.forms.fieldLabel.name'),
  description: t('rules.forms.fieldLabel.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(formFieldsSelector).forEach((field) => {
      if (!isElementVisible(field as unknown as HTMLElement)) return;

      const label = getAssociatedLabelText(field);
      if (!label.trim()) {
        violations.push(createViolation(fieldLabelRule, {
          element: field as unknown as HTMLElement,
          message: t('rules.forms.fieldLabel.message'),
          suggestion: t('rules.forms.fieldLabel.suggestion'),
          remediationAdvice: t('rules.forms.fieldLabel.remediation'),
          customIdPrefix: 'field-label',
        }));
      }
    });

    return violations;
  },
};

export const associatedFieldLabelRule: Rule = {
  id: 'field-label-associated',
  nbrReference: '5.9.3',
  name: t('rules.forms.associatedFieldLabel.name'),
  description: t('rules.forms.associatedFieldLabel.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(formFieldsSelector).forEach((field) => {
      if (!isElementVisible(field as unknown as HTMLElement)) return;

      const hasProgrammaticLabel =
        Boolean(getAssociatedLabelText(field).trim()) ||
        Boolean(field.getAttribute('aria-label')?.trim()) ||
        Boolean(field.getAttribute('aria-labelledby')?.trim());

      if (!hasProgrammaticLabel) {
        violations.push(createViolation(associatedFieldLabelRule, {
          element: field as unknown as HTMLElement,
          message: t('rules.forms.associatedFieldLabel.message'),
          suggestion: t('rules.forms.associatedFieldLabel.suggestion'),
          remediationAdvice: t('rules.forms.associatedFieldLabel.remediation'),
          customIdPrefix: 'field-label-associated',
        }));
      }
    });

    return violations;
  },
};

export const relatedFieldsRule: Rule = {
  id: 'related-fields',
  nbrReference: '5.9.6',
  name: t('rules.forms.relatedFields.name'),
  description: t('rules.forms.relatedFields.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const groups = new Map<string, HTMLInputElement[]>();

    document.querySelectorAll<HTMLInputElement>('input[type="radio"], input[type="checkbox"]').forEach((field) => {
      if (!field.name) return;
      if (!groups.has(field.name)) groups.set(field.name, []);
      groups.get(field.name)?.push(field);
    });

    groups.forEach((fields) => {
      if (fields.length < 2) return;
      const first = fields[0];
      if (!first.closest('fieldset, [role="group"], [role="radiogroup"]')) {
        violations.push(createViolation(relatedFieldsRule, {
          element: first,
          message: t('rules.forms.relatedFields.message', { name: first.name }),
          suggestion: t('rules.forms.relatedFields.suggestion'),
          remediationAdvice: t('rules.forms.relatedFields.remediation'),
          customIdPrefix: 'field-group',
        }));
      }
    });

    return violations;
  },
};

export const requiredFieldsRule: Rule = {
  id: 'required-fields',
  nbrReference: '5.9.7',
  name: t('rules.forms.requiredFields.name'),
  description: t('rules.forms.requiredFields.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(formFieldsSelector).forEach((field) => {
      if (!isElementVisible(field as unknown as HTMLElement)) return;

      const label = getAssociatedLabelText(field).toLowerCase();
      const visuallyRequired = label.includes('*') || label.includes('obrigatório') || label.includes('obrigatorio');
      const programmaticallyRequired = field.hasAttribute('required') || field.getAttribute('aria-required') === 'true';

      if (visuallyRequired && !programmaticallyRequired) {
        violations.push(createViolation(requiredFieldsRule, {
          element: field as unknown as HTMLElement,
          message: t('rules.forms.requiredFields.message'),
          suggestion: t('rules.forms.requiredFields.suggestion'),
          remediationAdvice: t('rules.forms.requiredFields.remediation'),
          customIdPrefix: 'required-field',
        }));
      }
    });

    return violations;
  },
};

export const dataTypeRule: Rule = {
  id: 'field-data-type',
  nbrReference: '5.9.8',
  name: t('rules.forms.dataType.name'),
  description: t('rules.forms.dataType.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLInputElement>('input').forEach((field) => {
      if (!isElementVisible(field)) return;
      if (['hidden', 'submit', 'button', 'reset', 'checkbox', 'radio', 'file'].includes(field.type)) return;

      const label = `${getAssociatedLabelText(field)} ${field.name} ${field.id} ${field.placeholder}`.toLowerCase();
      const autocomplete = field.getAttribute('autocomplete')?.toLowerCase() || '';
      const inputMode = field.getAttribute('inputmode')?.toLowerCase() || '';
      const expectedType =
        /\b(e-?mail|email)\b/.test(label) || autocomplete === 'email' ? 'email' :
        /\b(telefone|phone|celular|whatsapp)\b/.test(label) || autocomplete === 'tel' || inputMode === 'tel' ? 'tel' :
        /\b(url|site|website|link)\b/.test(label) || inputMode === 'url' ? 'url' :
        '';

      if (expectedType && field.type === 'text') {
        violations.push(createViolation(dataTypeRule, {
          element: field,
          message: t('rules.forms.dataType.message', { type: expectedType }),
          suggestion: t('rules.forms.dataType.suggestion', { type: expectedType }),
          remediationAdvice: t('rules.forms.dataType.remediation', { type: expectedType }),
          customIdPrefix: 'field-type',
        }));
      }
    });

    return violations;
  },
};

export const accessibleAuthenticationRule: Rule = {
  id: 'accessible-authentication',
  nbrReference: '5.9.18',
  name: t('rules.forms.accessibleAuthentication.name'),
  description: t('rules.forms.accessibleAuthentication.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    document.querySelectorAll<HTMLElement>('[class*="captcha" i], [id*="captcha" i], [title*="captcha" i], [aria-label*="captcha" i], [src*="captcha" i], [data-sitekey]').forEach((element) => {
      violations.push(createViolation(accessibleAuthenticationRule, {
        element,
        message: t('rules.forms.accessibleAuthentication.message'),
        suggestion: t('rules.forms.accessibleAuthentication.suggestion'),
        remediationAdvice: t('rules.forms.accessibleAuthentication.remediation'),
        customIdPrefix: 'captcha',
      }));
    });
    return violations;
  },
};

export const formRules: Rule[] = [
  fieldLabelRule,
  associatedFieldLabelRule,
  relatedFieldsRule,
  requiredFieldsRule,
  dataTypeRule,
  accessibleAuthenticationRule,
];
