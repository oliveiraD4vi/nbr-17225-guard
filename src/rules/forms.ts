import type { Rule, Violation } from '@/types';
import { createViolation, getAssociatedLabelText, isElementVisible } from '@/utils';

const formFieldsSelector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea';

export const fieldLabelRule: Rule = {
  id: 'field-label',
  nbrReference: '5.9.1',
  name: 'Rótulo de campo',
  description: 'Campos de formulário devem possuir rótulo identificável',
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
          message: 'Campo de formulário sem rótulo associado.',
          suggestion: 'Associe um <label>, aria-label ou aria-labelledby ao campo.',
          remediationAdvice: `<label for="email">E-mail</label>\n<input id="email" type="email" />`,
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
  name: 'Rótulo de campo associado',
  description: 'Rótulos de campos devem estar associados programaticamente ao respectivo controle',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(formFieldsSelector).forEach((field) => {
      if (!isElementVisible(field as unknown as HTMLElement)) return;

      const hasProgrammaticLabel =
        !!getAssociatedLabelText(field).trim() ||
        !!field.getAttribute('aria-label')?.trim() ||
        !!field.getAttribute('aria-labelledby')?.trim();

      if (!hasProgrammaticLabel) {
        violations.push(createViolation(associatedFieldLabelRule, {
          element: field as unknown as HTMLElement,
          message: 'Campo de formulário sem associação programática de rótulo.',
          suggestion: 'Associe o rótulo ao campo com for/id, aria-label ou aria-labelledby.',
          remediationAdvice: `<label for="nome">Nome</label>\n<input id="nome" name="nome" />`,
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
  name: 'Campos relacionados',
  description: 'Campos relacionados devem ser agrupados semanticamente',
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
          message: `Grupo de campos "${first.name}" sem agrupamento semântico.`,
          suggestion: 'Agrupe opções relacionadas com fieldset/legend ou role apropriado.',
          remediationAdvice: `<fieldset>\n  <legend>Forma de pagamento</legend>\n</fieldset>`,
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
  name: 'Campos obrigatórios',
  description: 'Campos obrigatórios devem ser programaticamente identificáveis',
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
          message: 'Campo aparenta ser obrigatório, mas não está marcado programaticamente.',
          suggestion: 'Use required ou aria-required="true" em campos obrigatórios.',
          remediationAdvice: `<input required aria-required="true" />`,
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
  name: 'Tipo de dado determinado',
  description: 'Campos devem usar tipos adequados ao dado solicitado',
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
          message: `Campo parece solicitar ${expectedType}, mas está usando type="text".`,
          suggestion: `Use type="${expectedType}" para melhorar entrada e validação.`,
          remediationAdvice: `<input type="${expectedType}" />`,
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
  name: 'Autenticação acessível mínima',
  description: 'Autenticação não deve depender apenas de quebra-cabeças cognitivos sem alternativa',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    document.querySelectorAll<HTMLElement>('[class*="captcha" i], [id*="captcha" i], [title*="captcha" i], [aria-label*="captcha" i], [src*="captcha" i], [data-sitekey]').forEach((element) => {
      violations.push(createViolation(accessibleAuthenticationRule, {
        element,
        message: 'Possível mecanismo de CAPTCHA detectado; exige validação manual de acessibilidade.',
        suggestion: 'Verifique se existe alternativa acessível ao desafio cognitivo.',
        remediationAdvice: `Ofereça autenticação sem depender exclusivamente de CAPTCHA visual.`,
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
