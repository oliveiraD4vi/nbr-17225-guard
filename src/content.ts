import { t } from './i18n';
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
        runAuditInPage(Boolean(request.includeRecommendations))
          .then((result) => sendResponse({ result }))
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : t('content.unknownAuditError');
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
    violations.forEach((violation) => renderViolationHighlight(violation));
  }

  async function runAuditInPage(includeRecommendations: boolean): Promise<AuditResult> {
    await ensureDocumentReady();
    clearHighlights();
    await waitForAuditStability();

    const violations: Violation[] = [];
    const rulesToRun = includeRecommendations
      ? allRules
      : allRules.filter((rule) => rule.severity === 'error');

    for (const rule of rulesToRun) {
      try {
        const ruleViolations = await rule.check();
        violations.push(...ruleViolations);
      } catch (error) {
        console.error(`[Guardião NBR 17225] Erro na regra ${rule.id}:`, error);
      }
    }

    const dedupedViolations = dedupeViolations(violations);

    const violationsByRule = dedupedViolations.reduce<Record<string, Violation[]>>((acc, violation) => {
      acc[violation.ruleId] ??= [];
      acc[violation.ruleId].push(violation);
      return acc;
    }, {});

    const violationsBySeverity = dedupedViolations.reduce<Record<'error' | 'warning', Violation[]>>(
      (acc, violation) => {
        acc[violation.severity].push(violation);
        return acc;
      },
      { error: [], warning: [] }
    );
    const humanReviewItems = dedupedViolations.filter((violation) => violation.requiresHumanReview).length;
    const automatedFindings = dedupedViolations.length - humanReviewItems;

    return {
      violations: dedupedViolations,
      totalViolations: dedupedViolations.length,
      errors: violationsBySeverity.error.length,
      warnings: violationsBySeverity.warning.length,
      humanReviewItems,
      automatedFindings,
      timestamp: Date.now(),
      url: window.location.href,
      pageTitle: document.title,
      includeRecommendations,
      violationsByRule,
      violationsBySeverity,
    };
  }

  function dedupeViolations(violations: Violation[]): Violation[] {
    const seen = new Set<string>();

    return violations.filter((violation) => {
      const signature = [
        violation.ruleId,
        violation.elementSelector || '',
        violation.message,
        violation.suggestion,
      ].join('|');

      if (seen.has(signature)) {
        return false;
      }

      seen.add(signature);
      return true;
    });
  }

  function highlightViolation(violation: Violation) {    
    clearHighlights();
    
    const existingHighlight = document.getElementById(`nbr-highlight-${violation.customId}`);
    if (existingHighlight) return;

    renderViolationHighlight(violation, true);

    if (!violation.elementSelector) return;

    const element = document.querySelector(violation.elementSelector);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function renderViolationHighlight(violation: Violation, startOpen = false) {
    try {
      if (!violation.elementSelector) return;

      const element = document.querySelector(violation.elementSelector);
      if (!(element instanceof HTMLElement)) {
        console.warn('[Guardião NBR 17225] Elemento não encontrado:', violation.elementSelector);
        return;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const verticalPosition = rect.top < 88 ? 'bottom' : 'top';
      const horizontalPosition =
        rect.left < 180 ? 'left' :
        window.innerWidth - rect.right < 180 ? 'right' :
        'center';

      const shadowHost = document.createElement('div');
      shadowHost.id = `nbr-highlight-${violation.customId}`;
      shadowHost.style.position = 'absolute';
      shadowHost.style.pointerEvents = 'none';
      shadowHost.style.zIndex = '999999';

      const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        :host {
          --highlight-color: ${violation.severity === 'error' ? '#dc2626' : '#d97706'};
          --highlight-soft: ${violation.severity === 'error' ? 'rgba(220, 38, 38, 0.14)' : 'rgba(217, 119, 6, 0.16)'};
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .highlight-box {
          position: absolute;
          inset: 0;
          border: 2px dashed var(--highlight-color);
          border-radius: 6px;
          pointer-events: auto;
          box-sizing: border-box;
          background: var(--highlight-soft);
        }

        .highlight-icon {
          position: absolute;
          top: -12px;
          right: -12px;
          width: 26px;
          height: 26px;
          border: 0;
          background: var(--highlight-color);
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
          cursor: pointer;
          pointer-events: auto;
        }

        .tooltip {
          position: absolute;
          min-width: 220px;
          max-width: 300px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #0f172a;
          color: white;
          font-size: 12px;
          line-height: 1.45;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.24);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s ease;
          z-index: 1000;
        }

        .tooltip.open {
          opacity: 1;
          visibility: visible;
        }

        .tooltip.position-top {
          bottom: calc(100% + 10px);
        }

        .tooltip.position-bottom {
          top: calc(100% + 10px);
        }

        .tooltip.position-left {
          left: 0;
          transform: translateY(0);
        }

        .tooltip.position-center {
          left: 50%;
          transform: translateX(-50%);
        }

        .tooltip.position-right {
          right: 0;
          transform: translateY(0);
        }

        .tooltip.position-top.position-center.open {
          transform: translateX(-50%) translateY(-2px);
        }

        .tooltip.position-bottom.position-center.open {
          transform: translateX(-50%) translateY(2px);
        }

        .tooltip.position-top.position-left.open,
        .tooltip.position-top.position-right.open {
          transform: translateY(-2px);
        }

        .tooltip.position-bottom.position-left.open,
        .tooltip.position-bottom.position-right.open {
          transform: translateY(2px);
        }

        .tooltip-title {
          display: block;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .tooltip-meta {
          display: block;
          color: rgba(255, 255, 255, 0.72);
        }
      `;

      const highlightBox = document.createElement('div');
      highlightBox.className = 'highlight-box';

      const icon = document.createElement('button');
      icon.className = 'highlight-icon';
      icon.type = 'button';
      icon.textContent = violation.severity === 'error' ? '!' : '?';
      icon.setAttribute('aria-label', t('content.highlightAriaLabel', { ruleName: violation.ruleName }));

      const tooltip = document.createElement('div');
      tooltip.className = `tooltip position-${verticalPosition} position-${horizontalPosition}`;
      tooltip.innerHTML = `
        <span class="tooltip-title">${violation.ruleName}</span>
        <span class="tooltip-meta">${t('content.highlightMeta', {
          reference: violation.nbrReference,
          severity: violation.severity === 'error'
            ? t('shared.severity.requirement')
            : t('shared.severity.recommendation'),
        })}</span>
      `;

      let pinnedOpen = startOpen;

      const syncTooltipVisibility = (forceOpen?: boolean) => {
        const isOpen = typeof forceOpen === 'boolean' ? forceOpen : pinnedOpen;
        tooltip.classList.toggle('open', isOpen);
      };

      icon.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        pinnedOpen = !pinnedOpen;
        syncTooltipVisibility();
      });

      highlightBox.addEventListener('mouseenter', () => {
        syncTooltipVisibility(true);
      });

      highlightBox.addEventListener('mouseleave', () => {
        syncTooltipVisibility(pinnedOpen);
      });

      highlightBox.appendChild(icon);
      highlightBox.appendChild(tooltip);
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(highlightBox);

      shadowHost.style.left = `${window.scrollX + rect.left}px`;
      shadowHost.style.top = `${window.scrollY + rect.top}px`;
      shadowHost.style.width = `${rect.width}px`;
      shadowHost.style.height = `${rect.height}px`;

      document.body.appendChild(shadowHost);
      if (startOpen) syncTooltipVisibility(true);
    } catch (error) {
      console.error('[Guardião NBR 17225] Erro ao destacar violação:', error);
    }
  }

  function clearHighlights() {
    const highlights = document.querySelectorAll('[id^="nbr-highlight-"]');
    highlights.forEach((highlight) => highlight.remove());
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

    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
  }

  async function waitForAuditStability(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    await new Promise<void>((resolve) => {
      let settled = false;
      let settleTimer = window.setTimeout(finish, 300);
      const timeoutId = window.setTimeout(finish, 1500);
      const observer = new MutationObserver(() => {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(finish, 300);
      });

      function finish() {
        if (settled) return;
        settled = true;
        observer.disconnect();
        window.clearTimeout(settleTimer);
        window.clearTimeout(timeoutId);
        resolve();
      }

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    });
  }

  console.log('[Guardião NBR 17225] Content script carregado');
}


