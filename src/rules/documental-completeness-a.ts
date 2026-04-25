import { t } from '@/i18n';
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
  name: t('rules.documentalCompletenessA.regionUsage.name'),
  description: t('rules.documentalCompletenessA.regionUsage.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const regions = document.querySelectorAll('header, main, footer, nav, aside, section, article, [role]');
    if (regions.length < 2) {
      return [createViolation(regionUsageRule, {
        element: document.body,
        message: t('rules.documentalCompletenessA.regionUsage.message'),
        suggestion: t('rules.documentalCompletenessA.regionUsage.suggestion'),
        remediationAdvice: t('rules.documentalCompletenessA.regionUsage.remediation'),
        customIdPrefix: 'region-usage',
      })];
    }
    return [];
  },
};

export const listUsageRule: Rule = {
  id: 'list-usage',
  nbrReference: '5.5.2',
  name: t('rules.documentalCompletenessA.listUsage.name'),
  description: t('rules.documentalCompletenessA.listUsage.description'),
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
            message: t('rules.documentalCompletenessA.listUsage.message'),
            suggestion: t('rules.documentalCompletenessA.listUsage.suggestion'),
            remediationAdvice: t('rules.documentalCompletenessA.listUsage.remediation'),
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
  name: t('rules.documentalCompletenessA.tableUsage.name'),
  description: t('rules.documentalCompletenessA.tableUsage.description'),
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
          message: t('rules.documentalCompletenessA.tableUsage.message'),
          suggestion: t('rules.documentalCompletenessA.tableUsage.suggestion'),
          remediationAdvice: t('rules.documentalCompletenessA.tableUsage.remediation'),
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
  name: t('rules.documentalCompletenessA.linkUsage.name'),
  description: t('rules.documentalCompletenessA.linkUsage.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    linkUsageRule,
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a')).filter((anchor) => {
      const href = anchor.getAttribute('href') || '';
      return href === '#' || href.toLowerCase().startsWith('javascript:');
    }),
    () => t('rules.documentalCompletenessA.linkUsage.message'),
    t('rules.documentalCompletenessA.linkUsage.suggestion'),
    t('rules.documentalCompletenessA.linkUsage.remediation'),
    'link-usage'
  ),
};

export const linkPurposeRule: Rule = {
  id: 'link-purpose',
  nbrReference: '5.7.4',
  name: t('rules.documentalCompletenessA.linkPurpose.name'),
  description: t('rules.documentalCompletenessA.linkPurpose.description'),
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
      (anchor) => t('rules.documentalCompletenessA.linkPurpose.message', { name: getAccessibleName(anchor) }),
      t('rules.documentalCompletenessA.linkPurpose.suggestion'),
      t('rules.documentalCompletenessA.linkPurpose.remediation'),
      'link-purpose'
    );
  },
};

export const navigationConsistencyRule: Rule = {
  id: 'navigation-consistency',
  nbrReference: '5.7.15',
  name: t('rules.documentalCompletenessA.navigationConsistency.name'),
  description: t('rules.documentalCompletenessA.navigationConsistency.description'),
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
      message: t('rules.documentalCompletenessA.navigationConsistency.message'),
      suggestion: t('rules.documentalCompletenessA.navigationConsistency.suggestion'),
      remediationAdvice: t('rules.documentalCompletenessA.navigationConsistency.remediation'),
      customIdPrefix: 'nav-consistency',
    })] : [];
  },
};

export const helpConsistencyRule: Rule = {
  id: 'help-consistency',
  nbrReference: '5.7.16',
  name: t('rules.documentalCompletenessA.helpConsistency.name'),
  description: t('rules.documentalCompletenessA.helpConsistency.description'),
  severity: 'warning',
  wcagLevel: 'A',
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
          message: t('rules.documentalCompletenessA.helpConsistency.message'),
          suggestion: t('rules.documentalCompletenessA.helpConsistency.suggestion'),
          remediationAdvice: t('rules.documentalCompletenessA.helpConsistency.remediation'),
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
  name: t('rules.documentalCompletenessA.buttonUsage.name'),
  description: t('rules.documentalCompletenessA.buttonUsage.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    buttonUsageRule,
    Array.from(document.querySelectorAll<HTMLElement>('[role="button"], a[onclick]')),
    () => t('rules.documentalCompletenessA.buttonUsage.message'),
    t('rules.documentalCompletenessA.buttonUsage.suggestion'),
    t('rules.documentalCompletenessA.buttonUsage.remediation'),
    'button-usage'
  ),
};

export const buttonPurposeRule: Rule = {
  id: 'button-purpose',
  nbrReference: '5.8.3',
  name: t('rules.documentalCompletenessA.buttonPurpose.name'),
  description: t('rules.documentalCompletenessA.buttonPurpose.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const vagueTexts = ['ok', 'ir', 'enviar', 'clique', 'mais'];
    return createWarnings(
      buttonPurposeRule,
      Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], input[type="button"], input[type="submit"]'))
        .filter((element) => vagueTexts.includes(getAccessibleName(element).trim().toLowerCase())),
      (element) => t('rules.documentalCompletenessA.buttonPurpose.message', { name: getAccessibleName(element) }),
      t('rules.documentalCompletenessA.buttonPurpose.suggestion'),
      t('rules.documentalCompletenessA.buttonPurpose.remediation'),
      'button-purpose'
    );
  },
};

export const buttonConsistencyRule: Rule = {
  id: 'button-consistency',
  nbrReference: '5.8.5',
  name: t('rules.documentalCompletenessA.buttonConsistency.name'),
  description: t('rules.documentalCompletenessA.buttonConsistency.description'),
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
      message: t('rules.documentalCompletenessA.buttonConsistency.message', { target: inconsistent[0] }),
      suggestion: t('rules.documentalCompletenessA.buttonConsistency.suggestion'),
      remediationAdvice: t('rules.documentalCompletenessA.buttonConsistency.remediation'),
      customIdPrefix: 'button-consistency',
    })] : [];
  },
};

export const contextChangeOnFocusRule: Rule = {
  id: 'context-change-focus',
  nbrReference: '5.8.9',
  name: t('rules.documentalCompletenessA.contextChangeOnFocus.name'),
  description: t('rules.documentalCompletenessA.contextChangeOnFocus.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    contextChangeOnFocusRule,
    Array.from(document.querySelectorAll<HTMLElement>('[onfocus], [autofocus]')),
    () => t('rules.documentalCompletenessA.contextChangeOnFocus.message'),
    t('rules.documentalCompletenessA.contextChangeOnFocus.suggestion'),
    t('rules.documentalCompletenessA.contextChangeOnFocus.remediation'),
    'context-focus'
  ),
};

export const contextChangeOnInputRule: Rule = {
  id: 'context-change-input',
  nbrReference: '5.8.10',
  name: t('rules.documentalCompletenessA.contextChangeOnInput.name'),
  description: t('rules.documentalCompletenessA.contextChangeOnInput.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    contextChangeOnInputRule,
    Array.from(document.querySelectorAll<HTMLElement>('select[onchange], input[onchange], textarea[onchange]')),
    () => t('rules.documentalCompletenessA.contextChangeOnInput.message'),
    t('rules.documentalCompletenessA.contextChangeOnInput.suggestion'),
    t('rules.documentalCompletenessA.contextChangeOnInput.remediation'),
    'context-input'
  ),
};

export const singlePointerRule: Rule = {
  id: 'single-pointer',
  nbrReference: '5.8.11',
  name: t('rules.documentalCompletenessA.singlePointer.name'),
  description: t('rules.documentalCompletenessA.singlePointer.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    singlePointerRule,
    Array.from(document.querySelectorAll<HTMLElement>('[onmousedown], [onpointerdown], [ontouchstart]')),
    () => t('rules.documentalCompletenessA.singlePointer.message'),
    t('rules.documentalCompletenessA.singlePointer.suggestion'),
    t('rules.documentalCompletenessA.singlePointer.remediation'),
    'single-pointer'
  ),
};

export const pointerGestureRule: Rule = {
  id: 'pointer-gesture',
  nbrReference: '5.8.12',
  name: t('rules.documentalCompletenessA.pointerGesture.name'),
  description: t('rules.documentalCompletenessA.pointerGesture.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    pointerGestureRule,
    Array.from(document.querySelectorAll<HTMLElement>('[ontouchstart], [ontouchmove], [ongesturestart], [ongesturechange]')),
    () => t('rules.documentalCompletenessA.pointerGesture.message'),
    t('rules.documentalCompletenessA.pointerGesture.suggestion'),
    t('rules.documentalCompletenessA.pointerGesture.remediation'),
    'pointer-gesture'
  ),
};

export const dragMovementRule: Rule = {
  id: 'drag-movement',
  nbrReference: '5.8.13',
  name: t('rules.documentalCompletenessA.dragMovement.name'),
  description: t('rules.documentalCompletenessA.dragMovement.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    dragMovementRule,
    Array.from(document.querySelectorAll<HTMLElement>('[draggable="true"], [ondragstart], [ondrop]')),
    () => t('rules.documentalCompletenessA.dragMovement.message'),
    t('rules.documentalCompletenessA.dragMovement.suggestion'),
    t('rules.documentalCompletenessA.dragMovement.remediation'),
    'drag-movement'
  ),
};

export const motionOperationRule: Rule = {
  id: 'motion-operation',
  nbrReference: '5.8.14',
  name: t('rules.documentalCompletenessA.motionOperation.name'),
  description: t('rules.documentalCompletenessA.motionOperation.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    motionOperationRule,
    Array.from(document.querySelectorAll<HTMLElement>('[data-motion], [data-shake], [data-tilt]')),
    () => t('rules.documentalCompletenessA.motionOperation.message'),
    t('rules.documentalCompletenessA.motionOperation.suggestion'),
    t('rules.documentalCompletenessA.motionOperation.remediation'),
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
