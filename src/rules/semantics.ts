import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName, isElementVisible } from '@/utils';

export const pageTitleRule: Rule = {
  id: 'page-title',
  nbrReference: '5.13.1',
  name: 'Título da página',
  description: 'A página deve possuir título significativo',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    if (!document.title.trim()) {
      violations.push(createViolation(pageTitleRule, {
        element: document.body,
        message: 'Documento sem título significativo.',
        suggestion: 'Defina um título descritivo no elemento <title>.',
        remediationAdvice: `<title>Título descritivo da página</title>`,
        customIdPrefix: 'page-title',
      }));
    }

    return violations;
  },
};

export const pageLanguageRule: Rule = {
  id: 'page-language',
  nbrReference: '5.13.2',
  name: 'Idioma da página',
  description: 'O elemento html deve declarar o idioma principal da página',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const html = document.documentElement;
    const lang = html.getAttribute('lang');

    if (!lang?.trim()) {
      violations.push(createViolation(pageLanguageRule, {
        element: html,
        message: 'Elemento html sem atributo lang.',
        suggestion: 'Declare o idioma principal da página no elemento html.',
        remediationAdvice: `<html lang="pt-BR">`,
        customIdPrefix: 'html-lang',
      }));
    }

    return violations;
  },
};

export const frameTitleRule: Rule = {
  id: 'frame-title',
  nbrReference: '5.13.4',
  name: 'Título de frame',
  description: 'Frames devem possuir título acessível',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    document.querySelectorAll<HTMLElement>('iframe, frame').forEach((frame) => {
      if (!getAccessibleName(frame).trim()) {
        violations.push(createViolation(frameTitleRule, {
          element: frame,
          message: 'Frame sem title ou nome acessível.',
          suggestion: 'Adicione um título que descreva o conteúdo incorporado.',
          remediationAdvice: `<iframe title="Mapa do evento"></iframe>`,
          customIdPrefix: 'frame-title',
        }));
      }
    });
    return violations;
  },
};

export const zoomAllowedRule: Rule = {
  id: 'zoom-allowed',
  nbrReference: '5.13.5',
  name: 'Zoom não bloqueado',
  description: 'A página não deve bloquear zoom do navegador',
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const content = viewport?.content.toLowerCase() || '';

    if (content.includes('user-scalable=no') || /maximum-scale\s*=\s*1(\.0)?/.test(content)) {
      violations.push(createViolation(zoomAllowedRule, {
        element: viewport as unknown as HTMLElement,
        message: 'Viewport bloqueia ou limita excessivamente o zoom.',
        suggestion: 'Remova user-scalable=no e não limite o zoom a 100%.',
        remediationAdvice: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
        customIdPrefix: 'zoom',
      }));
    }

    return violations;
  },
};

export const accessibleNameRule: Rule = {
  id: 'accessible-name',
  nbrReference: '5.13.10',
  name: 'Componentes com nome acessível',
  description: 'Componentes interativos devem possuir nome acessível',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const interactiveSelector = [
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
    ].join(', ');

    document.querySelectorAll<HTMLElement>(interactiveSelector).forEach((element) => {
      if (!isElementVisible(element)) return;
      if (!getAccessibleName(element).trim()) {
        violations.push(createViolation(accessibleNameRule, {
          element,
          message: 'Componente interativo sem nome acessível.',
          suggestion: 'Forneça texto visível, aria-label, aria-labelledby ou equivalente.',
          remediationAdvice: `<button aria-label="Abrir menu"></button>`,
          customIdPrefix: 'accessible-name',
        }));
      }
    });

    return violations;
  },
};

export const customStateRule: Rule = {
  id: 'custom-component-state',
  nbrReference: '5.13.13',
  name: 'Estados, propriedades e valores de componentes customizados',
  description: 'Componentes customizados devem expor estados ARIA quando aplicável',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const requiredStates: Record<string, string[]> = {
      checkbox: ['aria-checked'],
      radio: ['aria-checked'],
      switch: ['aria-checked'],
      slider: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
      combobox: ['aria-expanded'],
    };

    Object.entries(requiredStates).forEach(([role, attrs]) => {
      document.querySelectorAll<HTMLElement>(`[role="${role}"]`).forEach((element) => {
        const missing = attrs.filter(attr => !element.hasAttribute(attr));
        if (missing.length) {
          violations.push(createViolation(customStateRule, {
            element,
            message: `Componente com role="${role}" sem estados/propriedades obrigatórios: ${missing.join(', ')}.`,
            suggestion: 'Exponha estados ARIA coerentes para o componente customizado.',
            remediationAdvice: `<div role="${role}" ${attrs.map(attr => `${attr}="..."`).join(' ')}></div>`,
            customIdPrefix: 'custom-state',
          }));
        }
      });
    });

    return violations;
  },
};

export const semanticRules: Rule[] = [
  pageTitleRule,
  pageLanguageRule,
  frameTitleRule,
  zoomAllowedRule,
  accessibleNameRule,
  customStateRule,
];
