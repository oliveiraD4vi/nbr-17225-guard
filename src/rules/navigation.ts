import type { Rule, Violation } from '@/types';
import { createViolation, getAccessibleName, isElementVisible } from '@/utils';

export const linkSemanticRule: Rule = {
  id: 'link-semantic',
  nbrReference: '5.7.1',
  name: 'Semântica de link',
  description: 'Links devem usar elemento âncora com destino ou nome acessível',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLAnchorElement>('a').forEach((anchor) => {
      if (!isElementVisible(anchor)) return;

      const href = anchor.getAttribute('href');
      const name = getAccessibleName(anchor);

      if (!href || href.trim() === '') {
        violations.push(createViolation(linkSemanticRule, {
          element: anchor,
          message: 'Link sem atributo href.',
          suggestion: 'Use href para navegação ou troque por <button> se for uma ação.',
          remediationAdvice: `<a href="/destino">Acessar página</a>`,
          customIdPrefix: 'link-href',
        }));
      }

      if (!name.trim()) {
        violations.push(createViolation(linkSemanticRule, {
          element: anchor,
          message: 'Link sem nome acessível.',
          suggestion: 'Forneça texto visível, aria-label ou conteúdo alternativo descritivo.',
          remediationAdvice: `<a href="/contato">Fale conosco</a>`,
          customIdPrefix: 'link-name',
        }));
      }
    });

    return violations;
  },
};

export const skipLinksRule: Rule = {
  id: 'skip-links',
  nbrReference: '5.7.12',
  name: 'Links para contornar blocos de conteúdo',
  description: 'A página deve oferecer mecanismo para pular blocos repetidos',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const skipLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).find((link) => {
      const text = getAccessibleName(link).toLowerCase();
      return text.includes('pular') || text.includes('conteúdo') || text.includes('conteudo');
    });

    if (!skipLink) {
      violations.push(createViolation(skipLinksRule, {
        element: document.body,
        message: 'Nenhum link para pular blocos repetidos foi encontrado.',
        suggestion: 'Adicione um link de salto no início da página apontando para o conteúdo principal.',
        remediationAdvice: `<a href="#conteudo-principal" class="skip-link">Pular para o conteúdo principal</a>`,
        customIdPrefix: 'skip-link',
      }));
    }

    return violations;
  },
};

export const navigationRules: Rule[] = [
  linkSemanticRule,
  skipLinksRule,
];
