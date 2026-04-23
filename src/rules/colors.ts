/**
 * Regras da Seção 5.11 - Uso de Cores e Contraste
 * ABNT NBR 17225:2025
 */

import type { Rule, Violation } from '@/types';
import { 
  generateCustomId, 
  getElementSelector, 
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
        violations.push({
          id: generateCustomId(),
          ruleId: 'text-contrast',
          ruleName: 'Contraste para texto (mínimo)',
          nbrReference: '5.11.3',
          description: `Contraste insuficiente: ${ratio.toFixed(2)}:1 (mínimo: ${minRatio}:1)`,
          severity: 'error',
          wcagLevel: 'AA',
          message: `Razão de contraste ${ratio.toFixed(2)}:1 é menor que ${minRatio}:1`,
          snippet: parent.outerHTML.substring(0, 200),
          suggestion: 'Aumentar o contraste entre texto e fundo',
          remediationAdvice: `
            Opções para melhorar o contraste:
            1. Escureça o texto (cor mais escura)
            2. Clarifique o fundo (cor mais clara)
            3. Aumente o tamanho da fonte
            
            Razão de contraste atual: ${ratio.toFixed(2)}:1
            Razão mínima necessária: ${minRatio}:1
          `,
          elementSelector: getElementSelector(parent),
          customId: generateCustomId('contrast'),
        });
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
      const borderColor = window.getComputedStyle(el).borderColor;
      const bgColor = window.getComputedStyle(el).backgroundColor;

      const borderHex = rgbToHex(borderColor);
      const bgHex = rgbToHex(bgColor);

      const ratio = getContrastRatio(borderHex, bgHex);

      if (ratio < 3) {
        violations.push({
          id: generateCustomId(),
          ruleId: 'component-contrast',
          ruleName: 'Contraste para componentes',
          nbrReference: '5.11.4',
          description: `Contraste de componente insuficiente: ${ratio.toFixed(2)}:1`,
          severity: 'error',
          wcagLevel: 'AA',
          message: `Componente ${el.tagName} com contraste ${ratio.toFixed(2)}:1 (mínimo: 3:1)`,
          snippet: el.outerHTML.substring(0, 200),
          suggestion: 'Aumentar o contraste entre a borda/fundo do componente',
          remediationAdvice: `
            Melhore o contraste do componente:
            
            button {
              border: 2px solid #333;
              background-color: #f0f0f0;
            }
            
            Razão de contraste atual: ${ratio.toFixed(2)}:1
            Razão mínima necessária: 3:1
          `,
          elementSelector: getElementSelector(el),
          customId: generateCustomId('component-contrast'),
        });
      }
    });

    return violations;
  },
};

export const colorRules: Rule[] = [
  textContrastRule,
  componentContrastRule,
];
