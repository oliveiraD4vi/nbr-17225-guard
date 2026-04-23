/**
 * Regras da Secao 5.1 - Interacao por Teclado
 * ABNT NBR 17225:2025
 */

import type { Rule, Violation } from '@/types';
import {
  createViolation,
  getFocusableElements,
  isElementFullyInViewport,
  isElementPartiallyInViewport,
  isElementVisible,
} from '@/utils';

/**
 * 5.1.13 - Acessibilidade por teclado parcial
 */
export const keyboardAccessibilityRule: Rule = {
  id: 'keyboard-accessibility',
  nbrReference: '5.1.13',
  name: 'Acessibilidade por teclado parcial',
  description: 'Todos os elementos interativos devem ser acessíveis via teclado',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const interactiveElements = document.querySelectorAll<HTMLElement>(
      'a, button, input, select, textarea, [role="button"], [role="link"], [role="menuitem"], [onclick]'
    );

    interactiveElements.forEach((el) => {
      if (!isElementVisible(el)) return;

      const tabIndex = el.getAttribute('tabindex');
      const hasHref = el.tagName !== 'A' || !!el.getAttribute('href');
      const isNaturallyFocusable = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || (el.tagName === 'A' && hasHref);
      const isGenericOnClickOnly =
        el.hasAttribute('onclick') &&
        !el.hasAttribute('role') &&
        el.tagName !== 'A' &&
        el.tagName !== 'BUTTON' &&
        !el.matches('input, select, textarea');

      if (isGenericOnClickOnly && !el.textContent?.trim()) return;

      if (!isNaturallyFocusable && (!tabIndex || parseInt(tabIndex, 10) < 0)) {
        violations.push(createViolation(keyboardAccessibilityRule, {
          element: el,
          message: `Elemento ${el.tagName} com comportamento interativo não é focável via teclado.`,
          suggestion: 'Adicione tabindex="0" ou use elemento semântico apropriado.',
          remediationAdvice: `<button type="button">Ação</button>`,
          customIdPrefix: 'keyboard',
        }));
      }
    });

    return violations;
  },
};

/**
 * 5.1.1 - Indicador de foco visível
 */
export const focusIndicatorRule: Rule = {
  id: 'focus-indicator',
  nbrReference: '5.1.1',
  name: 'Indicador de foco visível',
  description: 'Elementos focáveis devem ter indicador de foco perceptível',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!activeElement || !isElementVisible(activeElement) || !getFocusableElements().includes(activeElement)) {
      return violations;
    }

    const styles = window.getComputedStyle(activeElement);
    const outlineStyle = styles.outlineStyle;
    const outlineWidth = parseFloat(styles.outlineWidth || '0');
    const boxShadow = styles.boxShadow;
    const borderStyle = styles.borderStyle;
    const borderWidth = parseFloat(styles.borderWidth || '0');

    if (
      (outlineStyle === 'none' || outlineWidth === 0) &&
      (!boxShadow || boxShadow === 'none') &&
      (borderStyle === 'none' || borderWidth === 0)
    ) {
      violations.push(createViolation(focusIndicatorRule, {
        element: activeElement,
        message: `Elemento ${activeElement.tagName} em foco pode não possuir indicador de foco visível.`,
        suggestion: 'Defina outline, box-shadow ou estilo perceptível em :focus/:focus-visible.',
        remediationAdvice: `button:focus-visible { outline: 2px solid #005fcc; outline-offset: 2px; }`,
        customIdPrefix: 'focus',
      }));
    }

    return violations;
  },
};

/**
 * 5.1.2 - Elemento em foco totalmente visível
 */
export const focusFullyVisibleRule: Rule = {
  id: 'focus-fully-visible',
  nbrReference: '5.1.2',
  name: 'Elemento em foco totalmente visível',
  description: 'Elementos focáveis devem conseguir ficar totalmente visíveis na viewport',
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!activeElement || !isElementVisible(activeElement) || !getFocusableElements().includes(activeElement)) {
      return [];
    }

    return !isElementFullyInViewport(activeElement)
      ? [createViolation(focusFullyVisibleRule, {
        element: activeElement,
        message: 'Elemento focável está fora da viewport ou potencialmente cortado.',
        suggestion: 'Garanta scroll adequado e evite conteúdo fixo que cubra o foco.',
        remediationAdvice: `scroll-margin-top: 16px;`,
        customIdPrefix: 'focus-full',
      })]
      : [];
  },
};

/**
 * 5.1.3 - Elemento em foco parcialmente visível
 */
export const focusPartiallyVisibleRule: Rule = {
  id: 'focus-partially-visible',
  nbrReference: '5.1.3',
  name: 'Elemento em foco parcialmente visível',
  description: 'Elementos focáveis não devem ficar praticamente ocultos ao receber foco',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!activeElement || !isElementVisible(activeElement) || !getFocusableElements().includes(activeElement)) {
      return [];
    }

    return !isElementPartiallyInViewport(activeElement)
      ? [createViolation(focusPartiallyVisibleRule, {
        element: activeElement,
        message: 'Elemento focável pode ficar invisível ao navegar por teclado.',
        suggestion: 'Reposicione o elemento ou permita rolagem até ele.',
        remediationAdvice: `element.scrollIntoView({ block: 'nearest' })`,
        customIdPrefix: 'focus-partial',
      })]
      : [];
  },
};

/**
 * 5.1.4 - Ordem de foco previsível
 */
export const focusOrderRule: Rule = {
  id: 'focus-order',
  nbrReference: '5.1.4',
  name: 'Ordem de foco previsível',
  description: 'A ordem de tabulação deve seguir fluxo lógico',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('[tabindex]').forEach((el) => {
      const value = Number(el.getAttribute('tabindex'));
      if (value > 0) {
        violations.push(createViolation(focusOrderRule, {
          element: el,
          message: `Elemento usa tabindex positivo (${value}), o que costuma quebrar a ordem lógica de foco.`,
          suggestion: 'Evite tabindex positivo; prefira a ordem natural do DOM.',
          remediationAdvice: `<button>Continuar</button>`,
          customIdPrefix: 'focus-order',
        }));
      }
    });

    return violations;
  },
};

/**
 * 5.1.6 - Armadilha de foco
 */
export const focusTrapRule: Rule = {
  id: 'focus-trap',
  nbrReference: '5.1.6',
  name: 'Armadilha de foco',
  description: 'Componentes modais devem permitir saída previsível do foco',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('dialog, [role="dialog"], [role="alertdialog"]').forEach((dialog) => {
      const focusable = getFocusableElements(dialog);
      const hasCloseControl = focusable.some((item) => {
        const text = (item.textContent || item.getAttribute('aria-label') || '').toLowerCase();
        return text.includes('fechar') || text.includes('close') || item.hasAttribute('data-close');
      });

      if (!hasCloseControl) {
        violations.push(createViolation(focusTrapRule, {
          element: dialog,
          message: 'Possível diálogo sem mecanismo claro para sair da interação.',
          suggestion: 'Forneça botão de fechar e tratamento de ESC quando aplicável.',
          remediationAdvice: `<button aria-label="Fechar modal">×</button>`,
          customIdPrefix: 'focus-trap',
        }));
      }
    });

    return violations;
  },
};

/**
 * 5.1.8 - Conteúdo adicional persistente
 */
export const additionalContentPersistentRule: Rule = {
  id: 'additional-content-persistent',
  nbrReference: '5.1.8',
  name: 'Conteúdo adicional persistente',
  description: 'Conteúdo adicional exibido em foco ou hover deve permanecer disponível',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('[role="tooltip"], [aria-describedby]').forEach((element) => {
      if (element.getAttribute('role') === 'tooltip' && !element.id) {
        violations.push(createViolation(additionalContentPersistentRule, {
          element,
          message: 'Tooltip sem identificação programática consistente.',
          suggestion: 'Use id no tooltip e associe-o ao elemento disparador.',
          remediationAdvice: `<div id="ajuda" role="tooltip">Descrição</div>`,
          customIdPrefix: 'tooltip-persistent',
        }));
      }
    });

    return violations;
  },
};

/**
 * 5.1.9 - Conteúdo adicional dispensável
 */
export const additionalContentDismissibleRule: Rule = {
  id: 'additional-content-dismissible',
  nbrReference: '5.1.9',
  name: 'Conteúdo adicional dispensável',
  description: 'Conteúdo adicional deve poder ser dispensado sem mover foco',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('[role="tooltip"], [role="dialog"], [popover]').forEach((element) => {
      const hasDismissControl = !!element.querySelector('button, [role="button"], [aria-label*="fechar" i], [aria-label*="close" i]');
      if (!hasDismissControl && element.getAttribute('role') !== 'tooltip') {
        violations.push(createViolation(additionalContentDismissibleRule, {
          element,
          message: 'Conteúdo adicional sem controle explícito de dispensa.',
          suggestion: 'Disponibilize mecanismo claro para fechar ou dispensar o conteúdo.',
          remediationAdvice: `<button aria-label="Fechar">Fechar</button>`,
          customIdPrefix: 'dismissible',
        }));
      }
    });

    return violations;
  },
};

/**
 * 5.1.11 - Atalhos de teclado sem tecla modificadora
 */
export const keyboardShortcutRule: Rule = {
  id: 'keyboard-shortcut',
  nbrReference: '5.1.11',
  name: 'Atalhos de teclado sem tecla modificadora',
  description: 'Atalhos de teclado de caractere único exigem verificação e cuidado especial',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    return Array.from(document.querySelectorAll<HTMLElement>('[accesskey]')).map((el) =>
      createViolation(keyboardShortcutRule, {
        element: el,
        message: `Atalho de teclado detectado via accesskey="${el.getAttribute('accesskey')}".`,
        suggestion: 'Evite atalhos de caractere único ou ofereça mecanismo para desativá-los.',
        remediationAdvice: `<button aria-keyshortcuts="Alt+S">Salvar</button>`,
        customIdPrefix: 'accesskey',
      })
    );
  },
};

export const keyboardRules: Rule[] = [
  keyboardAccessibilityRule,
  focusIndicatorRule,
  focusFullyVisibleRule,
  focusPartiallyVisibleRule,
  focusOrderRule,
  focusTrapRule,
  additionalContentPersistentRule,
  additionalContentDismissibleRule,
  keyboardShortcutRule,
];
