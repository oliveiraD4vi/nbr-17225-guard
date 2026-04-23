/**
 * Regras da Secao 5.2 - Imagens
 * ABNT NBR 17225:2025
 */

import type { Rule, Violation } from '@/types';
import { createViolation, isElementVisible } from '@/utils';

export const imageAltTextRule: Rule = {
  id: 'image-alt-text',
  nbrReference: '5.2.1',
  name: 'Texto alternativo para imagens de conteúdo',
  description: 'Imagens de conteúdo devem ter texto alternativo descritivo',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!isElementVisible(img)) return;
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const role = img.getAttribute('role');

      if (role === 'presentation' || role === 'none') return;

      if ((!alt || !alt.trim()) && (!ariaLabel || !ariaLabel.trim())) {
        violations.push(createViolation(imageAltTextRule, {
          element: img,
          message: 'Imagem de conteúdo sem texto alternativo.',
          suggestion: 'Adicione atributo alt descritivo ou aria-label apropriado.',
          remediationAdvice: `<img src="imagem.jpg" alt="Descrição clara da imagem" />`,
          customIdPrefix: 'image-alt',
        }));
      }
    });

    return violations;
  },
};

export const imageFunctionalAltRule: Rule = {
  id: 'image-functional-alt',
  nbrReference: '5.2.2',
  name: 'Texto alternativo para imagens funcionais',
  description: 'Imagens funcionais devem descrever sua ação ou destino',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLImageElement>('a img, button img').forEach((img) => {
      if (!isElementVisible(img)) return;
      const alt = img.getAttribute('alt');
      if (!alt || !alt.trim()) {
        violations.push(createViolation(imageFunctionalAltRule, {
          element: img,
          message: 'Imagem funcional sem texto alternativo descritivo.',
          suggestion: 'Descreva o destino do link ou a ação do botão.',
          remediationAdvice: `<img src="acao.png" alt="Abrir detalhes do evento" />`,
          customIdPrefix: 'image-functional',
        }));
      }
    });

    return violations;
  },
};

export const imageDecorativeRule: Rule = {
  id: 'image-decorative',
  nbrReference: '5.2.3',
  name: 'Texto alternativo para imagens decorativas',
  description: 'Imagens decorativas devem ser ocultadas de tecnologias assistivas',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      const ariaHidden = img.getAttribute('aria-hidden');
      const className = img.className.toLowerCase();

      const looksDecorative = ['icon', 'decor', 'divider', 'spacer', 'background'].some((token) => className.includes(token));
      if (looksDecorative && !(alt === '' || role === 'presentation' || role === 'none' || ariaHidden === 'true')) {
        violations.push(createViolation(imageDecorativeRule, {
          element: img,
          message: 'Imagem com forte indício de uso decorativo sem ocultação acessível.',
          suggestion: 'Use alt="" ou role="presentation" em imagens puramente decorativas.',
          remediationAdvice: `<img src="decoracao.png" alt="" role="presentation" />`,
          customIdPrefix: 'image-decorative',
        }));
      }
    });

    return violations;
  },
};

export const complexImageDescriptionRule: Rule = {
  id: 'complex-image-description',
  nbrReference: '5.2.4',
  name: 'Descrição para imagens complexas',
  description: 'Imagens complexas devem possuir descrição adicional quando necessário',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const alt = img.getAttribute('alt') || '';
      const className = img.className.toLowerCase();
      const src = img.src.toLowerCase();
      const looksComplex = ['chart', 'graph', 'map', 'diagram', 'infographic'].some((token) =>
        className.includes(token) || src.includes(token) || alt.toLowerCase().includes(token)
      );
      const hasLongDescription = !!(img.getAttribute('longdesc') || img.getAttribute('aria-describedby'));

      if (looksComplex && !hasLongDescription) {
        violations.push(createViolation(complexImageDescriptionRule, {
          element: img,
          message: 'Possível imagem complexa sem descrição longa associada.',
          suggestion: 'Associe longdesc, aria-describedby ou texto adjacente equivalente.',
          remediationAdvice: `<img aria-describedby="descricao-grafico" alt="Variação de desempenho" />`,
          customIdPrefix: 'image-complex',
        }));
      }
    });

    return violations;
  },
};

export const imageOfTextRule: Rule = {
  id: 'image-of-text',
  nbrReference: '5.2.5',
  name: 'Imagens de texto',
  description: 'Imagens de texto devem ser evitadas quando não forem essenciais',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const alt = (img.getAttribute('alt') || '').trim();
      if (alt.length >= 20 && !img.closest('a, button')) {
        violations.push(createViolation(imageOfTextRule, {
          element: img,
          message: 'Imagem com texto alternativo extenso pode representar imagem de texto.',
          suggestion: 'Prefira texto HTML estilizado sempre que o conteúdo textual não for essencialmente gráfico.',
          remediationAdvice: `<h2>Resultados oficiais</h2>`,
          customIdPrefix: 'image-text',
        }));
      }
    });

    return violations;
  },
};

export const imageRules: Rule[] = [
  imageAltTextRule,
  imageFunctionalAltRule,
  imageDecorativeRule,
  complexImageDescriptionRule,
  imageOfTextRule,
];
