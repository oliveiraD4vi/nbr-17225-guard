import { allRules } from './rules';
import type { AuditResult, Violation, VisionSimulationFilter } from './types';

const contentScope = globalThis as typeof globalThis & {
  __nbrGuardContentLoaded?: boolean;
};

if (contentScope.__nbrGuardContentLoaded) {
  console.log('[Guardião NBR 17225] Content script já carregado');
} else {
  contentScope.__nbrGuardContentLoaded = true;

const VISION_FILTER_HOST_ID = 'nbr-vision-filter-host';
const VISION_FILTER_IDS = {
  protanopia: 'nbr-protanopia-filter',
  deuteranopia: 'nbr-deuteranopia-filter',
  tritanopia: 'nbr-tritanopia-filter',
} as const;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Guardião NBR 17225] Mensagem recebida:', request.action);

  switch (request.action) {
    case 'PING':
      sendResponse({ status: 'OK' });
      break;

    case 'RUN_AUDIT':
      runAuditInPage()
        .then(result => sendResponse({ result }))
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Erro desconhecido ao auditar a página';
          sendResponse({ error: message });
        });
      return true;

    case 'HIGHLIGHT_ALL_VIOLATIONS':
      highlightAllViolations(request.violations);
      sendResponse({ status: 'OK' });
      break;

    case 'HIGHLIGHT_VIOLATION':
      highlightViolation(request.violation);
      sendResponse({ status: 'OK' });
      break;

    case 'CLEAR_HIGHLIGHTS':
      clearHighlights();
      sendResponse({ status: 'OK' });
      break;

    case 'APPLY_VISION_FILTER':
      applyVisionFilter(request.filter);
      sendResponse({ status: 'OK' });
      break;

    default:
      sendResponse({ status: 'UNKNOWN_ACTION' });
  }

  return true;
});

function highlightAllViolations(violations: Violation[]) {
  clearHighlights();
  violations.forEach(violation => renderViolationHighlight(violation));
}

async function runAuditInPage(): Promise<AuditResult> {
  await ensureDocumentReady();

  const violations: Violation[] = [];
  for (const rule of allRules) {
    try {
      const ruleViolations = await rule.check();
      violations.push(...ruleViolations);
    } catch (error) {
      console.error(`[Guardião NBR 17225] Erro na regra ${rule.id}:`, error);
    }
  }

  const violationsByRule = violations.reduce<Record<string, Violation[]>>((acc, violation) => {
    acc[violation.ruleId] ??= [];
    acc[violation.ruleId].push(violation);
    return acc;
  }, {});

  const violationsBySeverity = violations.reduce<Record<'error' | 'warning', Violation[]>>(
    (acc, violation) => {
      acc[violation.severity].push(violation);
      return acc;
    },
    { error: [], warning: [] }
  );

  return {
    violations,
    totalViolations: violations.length,
    errors: violationsBySeverity.error.length,
    warnings: violationsBySeverity.warning.length,
    timestamp: Date.now(),
    url: window.location.href,
    violationsByRule,
    violationsBySeverity,
  };
}

function highlightViolation(violation: Violation) {
  clearHighlights();
  renderViolationHighlight(violation);

  if (!violation.elementSelector) return;

  const element = document.querySelector(violation.elementSelector);
  if (element instanceof HTMLElement) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function renderViolationHighlight(violation: Violation) {
  try {
    if (!violation.elementSelector) return;

    const element = document.querySelector(violation.elementSelector);
    if (!(element instanceof HTMLElement)) {
      console.warn('[Guardião NBR 17225] Elemento não encontrado:', violation.elementSelector);
      return;
    }

    const shadowHost = document.createElement('div');
    shadowHost.id = `nbr-highlight-${violation.customId}`;
    shadowHost.style.position = 'absolute';
    shadowHost.style.pointerEvents = 'none';
    shadowHost.style.zIndex = '999999';

    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --highlight-color: ${violation.severity === 'error' ? '#f5222d' : '#faad14'};
      }

      .highlight-box {
        position: absolute;
        inset: 0;
        border: 3px dashed var(--highlight-color);
        border-radius: 4px;
        pointer-events: auto;
        cursor: pointer;
        background: rgba(0, 0, 0, 0.02);
        box-sizing: border-box;
      }

      .highlight-icon {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 24px;
        height: 24px;
        background: var(--highlight-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .tooltip {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--highlight-color);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: var(--highlight-color);
      }
    `;

    const highlightBox = document.createElement('div');
    highlightBox.className = 'highlight-box';

    const icon = document.createElement('div');
    icon.className = 'highlight-icon';
    icon.textContent = violation.severity === 'error' ? '✕' : '⚠';

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = `${violation.ruleName} (NBR ${violation.nbrReference})`;

    highlightBox.appendChild(icon);
    highlightBox.appendChild(tooltip);
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(highlightBox);

    const rect = element.getBoundingClientRect();
    shadowHost.style.left = `${window.scrollX + rect.left}px`;
    shadowHost.style.top = `${window.scrollY + rect.top}px`;
    shadowHost.style.width = `${rect.width}px`;
    shadowHost.style.height = `${rect.height}px`;

    document.body.appendChild(shadowHost);
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao destacar violação:', error);
  }
}

function clearHighlights() {
  const highlights = document.querySelectorAll('[id^="nbr-highlight-"]');
  highlights.forEach(highlight => highlight.remove());
}

function applyVisionFilter(filter: VisionSimulationFilter) {
  try {
    if (!document.body) return;

    ensureVisionFilterDefs();

    const target = document.documentElement;
    if (!filter || filter.type === 'none') {
      target.style.filter = 'none';
      return;
    }

    switch (filter.type) {
      case 'protanopia':
      case 'deuteranopia':
      case 'tritanopia':
        target.style.filter = `url(#${VISION_FILTER_IDS[filter.type]})`;
        break;
      case 'blur':
        target.style.filter = `blur(${(filter.intensity / 100) * 10}px)`;
        break;
    }
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao aplicar simulador de visão:', error);
  }
}

function ensureVisionFilterDefs() {
  if (document.getElementById(VISION_FILTER_HOST_ID)) return;

  const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  host.setAttribute('id', VISION_FILTER_HOST_ID);
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'absolute';
  host.style.width = '0';
  host.style.height = '0';
  host.style.pointerEvents = 'none';

  host.innerHTML = `
    <defs>
      <filter id="${VISION_FILTER_IDS.protanopia}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0" />
      </filter>
      <filter id="${VISION_FILTER_IDS.deuteranopia}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0" />
      </filter>
      <filter id="${VISION_FILTER_IDS.tritanopia}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0" />
      </filter>
    </defs>
  `;

  document.body.appendChild(host);
}

function ensureDocumentReady(): Promise<void> {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
}

console.log('[Guardião NBR 17225] Content script carregado');
}
