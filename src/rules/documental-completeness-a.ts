import type { Rule, Violation } from '@/types';
import {
  createViolation,
  getAccessibleName,
} from '@/utils';

function createWarnings(
  rule: Rule,
  elements: HTMLElement[],
  messageFactory: (element: HTMLElement) => string,
  suggestion: string,
  remediationAdvice: string,
  customIdPrefix: string
): Violation[] {
  return elements.map((element) =>
    createViolation(rule, {
      element,
      message: messageFactory(element),
      suggestion,
      remediationAdvice,
      customIdPrefix,
    })
  );
}

export const regionUsageRule: Rule = {
  id: 'region-usage',
  nbrReference: '5.4.2',
  name: 'Uso de regiões',
  description: 'Regiões devem organizar logicamente a página',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const regions = document.querySelectorAll('header, main, footer, nav, aside, section, article, [role]');
    if (regions.length < 2) {
      return [createViolation(regionUsageRule, {
        element: document.body,
        message: 'A página apresenta pouca estrutura regional explícita.',
        suggestion: 'Organize o conteúdo com header, main, footer, nav e regiões complementares.',
        remediationAdvice: `<header>...</header><main>...</main><footer>...</footer>`,
        customIdPrefix: 'region-usage',
      })];
    }
    return [];
  },
};

export const listUsageRule: Rule = {
  id: 'list-usage',
  nbrReference: '5.5.2',
  name: 'Uso de listas',
  description: 'Itens correlatos devem ser agrupados em listas quando apropriado',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];
    document.querySelectorAll<HTMLElement>('div, section').forEach((container) => {
      const children = Array.from(container.children).filter((child) => ['P', 'DIV', 'SPAN'].includes(child.tagName));
      if (children.length >= 3 && !container.querySelector('ul, ol, dl')) {
        const bulletLike = children.filter((child) => /^[\u2022\-*0-9]/.test((child.textContent || '').trim()));
        if (bulletLike.length >= 3) {
          violations.push(createViolation(listUsageRule, {
            element: container,
            message: 'Há indício de itens correlatos apresentados fora de lista semântica.',
            suggestion: 'Use ul, ol ou dl para agrupar itens relacionados.',
            remediationAdvice: `<ul><li>Item</li></ul>`,
            customIdPrefix: 'list-usage',
          }));
        }
      }
    });
    return violations;
  },
};

export const tableUsageRule: Rule = {
  id: 'table-usage',
  nbrReference: '5.6.2',
  name: 'Uso de tabelas',
  description: 'Tabelas devem ser usadas para dados tabulares, não layout',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];
    document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
      const hasHeaders = !!table.querySelector('th, caption, thead');
      const hasManyControls = table.querySelectorAll('img, a, button').length > table.querySelectorAll('td, th').length / 2;
      if (!hasHeaders && hasManyControls) {
        violations.push(createViolation(tableUsageRule, {
          element: table,
          message: 'Tabela com indícios de uso para layout em vez de dados.',
          suggestion: 'Use layout CSS e reserve tabelas para dados tabulares.',
          remediationAdvice: `<div class="grid-layout">...</div>`,
          customIdPrefix: 'table-usage',
        }));
      }
    });
    return violations;
  },
};

export const linkUsageRule: Rule = {
  id: 'link-usage',
  nbrReference: '5.7.2',
  name: 'Uso de links',
  description: 'Links devem ser usados para navegação e não para ações genéricas',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    linkUsageRule,
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).filter((anchor) => {
      const href = anchor.getAttribute('href') || '';
      return href === '#' || href.toLowerCase().startsWith('javascript:');
    }),
    () => 'Link com href não navegável, possivelmente usado como botão.',
    'Use button para ações que não navegam.',
    `<button type="button">Abrir modal</button>`,
    'link-usage'
  ),
};

export const linkPurposeRule: Rule = {
  id: 'link-purpose',
  nbrReference: '5.7.4',
  name: 'Propósito do link no contexto',
  description: 'O texto do link deve comunicar o destino ou propósito',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const vagueTexts = ['clique aqui', 'saiba mais', 'mais', 'aqui', 'ver mais', 'leia mais'];
    return createWarnings(
      linkPurposeRule,
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).filter((anchor) =>
        vagueTexts.includes(getAccessibleName(anchor).trim().toLowerCase())
      ),
      (anchor) => `Texto do link "${getAccessibleName(anchor)}" é vago fora de contexto.`,
      'Use texto que descreva o destino do link.',
      `<a href="/regulamento">Ler regulamento da prova</a>`,
      'link-purpose'
    );
  },
};

export const navigationConsistencyRule: Rule = {
  id: 'navigation-consistency',
  nbrReference: '5.7.15',
  name: 'Navegação consistente',
  description: 'Blocos de navegação repetidos devem manter ordem consistente',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const navs = Array.from(document.querySelectorAll<HTMLElement>('nav, [role="navigation"]'));
    if (navs.length < 2) return [];
    const signatures = navs.map((nav) =>
      Array.from(nav.querySelectorAll('a[href]'))
        .map((link) => getAccessibleName(link as HTMLElement).trim())
        .filter(Boolean)
        .join('|')
    );
    return new Set(signatures).size > 1 ? [createViolation(navigationConsistencyRule, {
      element: navs[0],
      message: 'Blocos de navegação repetidos com ordem ou rótulos inconsistentes.',
      suggestion: 'Mantenha a mesma estrutura e ordem relativa para navegação recorrente.',
      remediationAdvice: `<nav><a href="/inicio">Início</a><a href="/eventos">Eventos</a></nav>`,
      customIdPrefix: 'nav-consistency',
    })] : [];
  },
};

export const helpConsistencyRule: Rule = {
  id: 'help-consistency',
  nbrReference: '5.7.16',
  name: 'Ajuda consistente',
  description: 'Mecanismos recorrentes de ajuda devem permanecer consistentes',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const helpLinks = Array.from(document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('a[href], button')).filter((element) => {
      const text = getAccessibleName(element as HTMLElement).toLowerCase();
      return text.includes('ajuda') || text.includes('suporte') || text.includes('faq');
    });
    if (helpLinks.length > 1) {
      const labels = new Set(helpLinks.map((el) => getAccessibleName(el as HTMLElement).trim().toLowerCase()));
      if (labels.size > 1) {
        return [createViolation(helpConsistencyRule, {
          element: helpLinks[0] as unknown as HTMLElement,
          message: 'Mecanismos de ajuda com identificação inconsistente.',
          suggestion: 'Padronize rótulos e posição relativa de ajuda recorrente.',
          remediationAdvice: `<a href="/ajuda">Ajuda</a>`,
          customIdPrefix: 'help-consistency',
        })];
      }
    }
    return [];
  },
};

export const buttonUsageRule: Rule = {
  id: 'button-usage',
  nbrReference: '5.8.2',
  name: 'Uso de botões',
  description: 'Botões devem ser usados para ações na interface',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    buttonUsageRule,
    Array.from(document.querySelectorAll<HTMLElement>('[role="button"], a[onclick]')),
    () => 'Elemento não semântico realizando ação típica de botão.',
    'Use button nativo sempre que possível.',
    `<button type="button">Salvar</button>`,
    'button-usage'
  ),
};

export const buttonPurposeRule: Rule = {
  id: 'button-purpose',
  nbrReference: '5.8.3',
  name: 'Propósito do botão',
  description: 'Botões devem comunicar claramente o que fazem',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const vagueTexts = ['ok', 'ir', 'enviar', 'clique', 'mais'];
    return createWarnings(
      buttonPurposeRule,
      Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], input[type="button"], input[type="submit"]'))
        .filter((element) => vagueTexts.includes(getAccessibleName(element).trim().toLowerCase())),
      (element) => `Botão "${getAccessibleName(element)}" pode não indicar propósito suficiente.`,
      'Use rótulos que descrevam a ação final.',
      `<button>Baixar relatório em CSV</button>`,
      'button-purpose'
    );
  },
};

export const buttonConsistencyRule: Rule = {
  id: 'button-consistency',
  nbrReference: '5.8.5',
  name: 'Identificação consistente em conjunto de páginas',
  description: 'Controles com a mesma função devem manter identificação consistente',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a[href]'));
    const byTarget = new Map<string, Set<string>>();
    buttons.forEach((button) => {
      const target = button.getAttribute('href') || button.getAttribute('data-action') || '';
      const name = getAccessibleName(button).trim();
      if (!target || !name) return;
      if (!byTarget.has(target)) byTarget.set(target, new Set());
      byTarget.get(target)?.add(name.toLowerCase());
    });
    const inconsistent = Array.from(byTarget.entries()).find(([, names]) => names.size > 1);
    return inconsistent ? [createViolation(buttonConsistencyRule, {
      element: document.body,
      message: `Ações equivalentes possuem rótulos diferentes para o mesmo alvo "${inconsistent[0]}".`,
      suggestion: 'Padronize o nome dos controles que realizam a mesma ação.',
      remediationAdvice: `Use sempre "Entrar" para o fluxo de login.`,
      customIdPrefix: 'button-consistency',
    })] : [];
  },
};

export const contextChangeOnFocusRule: Rule = {
  id: 'context-change-focus',
  nbrReference: '5.8.9',
  name: 'Mudança de contexto previsível no foco',
  description: 'Focar um elemento não deve mudar o contexto inesperadamente',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    contextChangeOnFocusRule,
    Array.from(document.querySelectorAll<HTMLElement>('[onfocus], [autofocus]')),
    () => 'Elemento com comportamento em foco que requer validação manual de mudança de contexto.',
    'Evite redirecionar ou abrir conteúdo automaticamente ao focar.',
    `<input onfocus="..." /> requer validação manual.`,
    'context-focus'
  ),
};

export const contextChangeOnInputRule: Rule = {
  id: 'context-change-input',
  nbrReference: '5.8.10',
  name: 'Mudança de contexto previsível na entrada',
  description: 'Entrada de dados não deve causar mudança de contexto inesperada',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    contextChangeOnInputRule,
    Array.from(document.querySelectorAll<HTMLElement>('select[onchange], input[onchange], textarea[onchange]')),
    () => 'Campo com mudança de contexto potencial ao alterar valor.',
    'Evite submissão ou redirecionamento automáticos sem aviso.',
    `<select onchange="..."> requer validação manual.`,
    'context-input'
  ),
};

export const singlePointerRule: Rule = {
  id: 'single-pointer',
  nbrReference: '5.8.11',
  name: 'Acionamento por ponteiro único',
  description: 'Acionamentos devem ocorrer de forma previsível com ponteiro único',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    singlePointerRule,
    Array.from(document.querySelectorAll<HTMLElement>('[onmousedown], [onpointerdown], [ontouchstart]')),
    () => 'Elemento depende de evento de pressionar em vez de soltar/confirmar.',
    'Prefira acionar ações no click/up-event e permitir cancelamento.',
    `<button onclick="acao()">Enviar</button>`,
    'single-pointer'
  ),
};

export const pointerGestureRule: Rule = {
  id: 'pointer-gesture',
  nbrReference: '5.8.12',
  name: 'Operação por gestos de ponteiro',
  description: 'Gestos complexos devem ter alternativa simples',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    pointerGestureRule,
    Array.from(document.querySelectorAll<HTMLElement>('[ontouchstart], [ontouchmove], [ongesturestart], [ongesturechange]')),
    () => 'Gestos de ponteiro complexos detectados; validar alternativa simples.',
    'Forneça ação equivalente por toque simples ou controle visível.',
    `Adicione alternativa por botão para gestos complexos.`,
    'pointer-gesture'
  ),
};

export const dragMovementRule: Rule = {
  id: 'drag-movement',
  nbrReference: '5.8.13',
  name: 'Operação por movimento de arrastar',
  description: 'Arrastar deve ter alternativa sem arraste',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    dragMovementRule,
    Array.from(document.querySelectorAll<HTMLElement>('[draggable="true"], [ondragstart], [ondrop]')),
    () => 'Interação por arrastar detectada; verificar alternativa equivalente.',
    'Forneça botões ou seleção simples como alternativa ao arraste.',
    `Inclua controles mover para cima/baixo como alternativa.`,
    'drag-movement'
  ),
};

export const motionOperationRule: Rule = {
  id: 'motion-operation',
  nbrReference: '5.8.14',
  name: 'Operação por movimento',
  description: 'Operações por movimento do dispositivo devem ter alternativa',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    motionOperationRule,
    Array.from(document.querySelectorAll<HTMLElement>('[data-motion], [data-shake], [data-tilt]')),
    () => 'Indício de operação por movimento detectado; validar alternativa sem movimento.',
    'Disponibilize controle equivalente por interface tradicional.',
    `Adicione botão ou alternador para a mesma operação.`,
    'motion-operation'
  ),
};

export const documentalCompletenessRulesA: Rule[] = [
  regionUsageRule,
  listUsageRule,
  tableUsageRule,
  linkUsageRule,
  linkPurposeRule,
  navigationConsistencyRule,
  helpConsistencyRule,
  buttonUsageRule,
  buttonPurposeRule,
  buttonConsistencyRule,
  contextChangeOnFocusRule,
  contextChangeOnInputRule,
  singlePointerRule,
  pointerGestureRule,
  dragMovementRule,
  motionOperationRule,
];
