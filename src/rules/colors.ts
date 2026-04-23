/**
 * Regras da Seção 5.11 - Uso de Cores e Contraste
 * ABNT NBR 17225:2025
 */

import type { Rule, Violation } from '@/types';
import { 
  createViolation,
  getContrastRatio, 
  rgbToHex,
  getEffectiveBackgroundColor,
  isElementVisible
} from '@/utils';

/**
 * 5.11.3 - Contraste para texto (mínimo)
 * Totalmente Automatizável
 * Nível AA
 */
export const textContrastRule: Rule = {
  id: 'text-contrast',
  nbrReference: '5.11.3',
  name: 'Contraste para texto (mínimo)',
  description: 'Texto deve ter razão de contraste mínima de 4.5:1 para texto normal',
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const seenParents = new Set<HTMLElement>();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const text = textNode.textContent?.trim();
      
      if (!text || text.length === 0) continue;

      const parent = textNode.parentElement;
      if (!parent || !isElementVisible(parent)) continue;
      if (seenParents.has(parent)) continue;

      seenParents.add(parent);

      const textColor = window.getComputedStyle(parent).color;
      const bgColor = getEffectiveBackgroundColor(parent);

      const textHex = rgbToHex(textColor);
      const bgHex = rgbToHex(bgColor);

      const ratio = getContrastRatio(textHex, bgHex);
      const fontSize = parseFloat(window.getComputedStyle(parent).fontSize);
      const fontWeight = window.getComputedStyle(parent).fontWeight;

      // Verifica se é texto grande (18pt ou 14pt bold)
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      const minRatio = isLargeText ? 3 : 4.5;

      if (ratio < minRatio) {
        violations.push(createViolation(textContrastRule, {
          element: parent,
          description: `Contraste insuficiente: ${ratio.toFixed(2)}:1 (mínimo: ${minRatio}:1)`,
          message: `Razão de contraste ${ratio.toFixed(2)}:1 é menor que ${minRatio}:1`,
          suggestion: 'Aumentar o contraste entre texto e fundo',
          remediationAdvice: `Escureça o texto, clareie o fundo ou aumente o tamanho/peso visual quando aplicável. Razão atual: ${ratio.toFixed(2)}:1. Razão mínima: ${minRatio}:1.`,
          customIdPrefix: 'contrast',
        }));
      }
    }

    return violations;
  },
};

/**
 * 5.11.4 - Contraste para componentes
 * Totalmente Automatizável
 * Nível AA
 */
export const componentContrastRule: Rule = {
  id: 'component-contrast',
  nbrReference: '5.11.4',
  name: 'Contraste para componentes',
  description: 'Componentes interativos devem ter contraste mínimo de 3:1',
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const components = document.querySelectorAll('button, input, select, textarea, [role="button"]');

    components.forEach((component) => {
      if (!isElementVisible(component as HTMLElement)) return;

      const el = component as HTMLElement;
      const styles = window.getComputedStyle(el);
      const borderWidth = parseFloat(styles.borderWidth || '0');
      const borderColor = styles.borderColor;
      const bgColor = styles.backgroundColor;
      const surroundingColor = getEffectiveBackgroundColor(el.parentElement as HTMLElement || el);

      if (borderWidth <= 0) return;
      if (borderColor === 'transparent' || bgColor === 'transparent') return;

      const borderHex = rgbToHex(borderColor);
      const bgHex = rgbToHex(bgColor);
      const surroundingHex = rgbToHex(surroundingColor);

      const internalRatio = getContrastRatio(borderHex, bgHex);
      const externalRatio = getContrastRatio(borderHex, surroundingHex);
      const ratio = Math.max(internalRatio, externalRatio);

      if (ratio < 3) {
        violations.push(createViolation(componentContrastRule, {
          element: el,
          description: `Contraste de componente insuficiente: ${ratio.toFixed(2)}:1`,
          message: `Componente ${el.tagName} com contraste ${ratio.toFixed(2)}:1 (mínimo: 3:1)`,
          suggestion: 'Aumentar o contraste entre a borda/fundo do componente',
          remediationAdvice: `Garanta contraste mínimo de 3:1 entre o indicador visual do componente e as áreas adjacentes. Razão atual: ${ratio.toFixed(2)}:1.`,
          customIdPrefix: 'component-contrast',
        }));
      }
    });

    return violations;
  },
};

export const colorRules: Rule[] = [
  textContrastRule,
  componentContrastRule,
];
