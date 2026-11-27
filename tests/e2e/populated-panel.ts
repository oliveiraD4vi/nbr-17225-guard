import type { Page } from '@playwright/test'
import { CURRENT_AUDIT_SCHEMA_VERSION, type AuditResult, type Violation } from '../../src/types'

const inspectedTab = { id: 4242, title: 'Contato', url: 'https://example.com/contato' }

const baseViolation = {
  wcagLevel: 'A',
  automationCategory: 'Totalmente Automatizável',
  verificationMode: 'automatic',
  auditScope: 'page',
  confidence: 'high',
  evidence: [],
  normativeType: 'Requisito',
  requiresHumanReview: false,
  humanReviewStatus: 'not_applicable',
  findingOrigin: 'automatic',
  findingStatus: 'open',
} satisfies Partial<Violation>

const violations: Violation[] = [
  {
    ...baseViolation,
    id: 'missing-alt',
    customId: 'missing-alt',
    ruleId: 'image-alt-text',
    ruleName: 'Texto alternativo em imagens',
    nbrReference: '5.2.1',
    description: 'Imagens precisam de alternativa textual.',
    severity: 'error',
    message: 'Imagem sem texto alternativo.',
    snippet: '<img src="logo.png">',
    suggestion: 'Adicione um atributo alt.',
    remediationAdvice: 'Descreva o conteúdo da imagem.',
    elementSelector: 'img',
    elementTagName: 'img',
  },
  {
    ...baseViolation,
    id: 'low-contrast',
    customId: 'low-contrast',
    ruleId: 'text-contrast',
    ruleName: 'Contraste de texto',
    nbrReference: '5.11.2',
    description: 'O texto precisa de contraste suficiente com o fundo.',
    severity: 'error',
    wcagLevel: 'AA',
    message: 'Contraste de 2,9:1, abaixo de 4,5:1.',
    snippet: '<p class="legenda">Atendimento das 8h às 18h</p>',
    suggestion: 'Escureça o texto ou clareie o fundo.',
    remediationAdvice: 'Use cores com contraste mínimo de 4,5:1.',
    elementSelector: 'p.legenda',
    elementTagName: 'p',
    contrastDetails: {
      context: 'text',
      foregroundHex: '#9ca3af',
      backgroundHex: '#ffffff',
      measuredRatio: 2.9,
      minimumRatio: 4.5,
    },
  },
  {
    ...baseViolation,
    id: 'vague-link',
    customId: 'vague-link',
    ruleId: 'link-purpose-recommendation',
    ruleName: 'Propósito do link sem contexto',
    nbrReference: '5.7.10',
    description: 'Recomenda que o propósito de cada link seja compreensível isoladamente.',
    severity: 'warning',
    automationCategory: 'Semi-Automatizável',
    verificationMode: 'assisted',
    confidence: 'medium',
    normativeType: 'Recomendação',
    requiresHumanReview: true,
    humanReviewStatus: 'pending',
    reviewQuestion: 'O texto do link indica o destino sem depender do contexto?',
    message: 'Candidato para revisão: propósito do link sem contexto.',
    snippet: '<a href="/planos">Saiba mais</a>',
    suggestion: 'O texto do link indica o destino sem depender do contexto?',
    remediationAdvice: 'Registre a evidência observada.',
    elementSelector: 'a[href="/planos"]',
    elementTagName: 'a',
  },
]

function createAudit(id: string, timestamp: number, auditViolations: Violation[]): AuditResult {
  const humanReviewItems = auditViolations.filter((violation) => violation.requiresHumanReview)
  return {
    schemaVersion: CURRENT_AUDIT_SCHEMA_VERSION,
    id,
    timestamp,
    url: inspectedTab.url,
    pageTitle: inspectedTab.title,
    includeRecommendations: true,
    includeHumanReview: true,
    auditScope: 'page',
    scoreRange: { conservative: 72, confirmed: 80 },
    ruleExecution: { executed: 96, withCandidates: 1, awaitingManualReview: 12 },
    totalViolations: auditViolations.length,
    errors: auditViolations.filter((violation) => violation.normativeType === 'Requisito').length,
    warnings: auditViolations.filter((violation) => violation.normativeType === 'Recomendação')
      .length,
    humanReviewItems: humanReviewItems.length,
    automatedFindings: auditViolations.length - humanReviewItems.length,
    violations: auditViolations,
    violationsByRule: {},
    violationsBySeverity: { error: [], warning: [] },
  }
}

/**
 * Opens the DevTools panel as if it inspected a page that was audited twice. DevTools is not
 * there outside a real DevTools window, so the inspected tab is stubbed and the audits are seeded
 * into the extension's storage.
 */
export async function openPopulatedPanel(page: Page, extensionId: string): Promise<void> {
  const latest = createAudit('audit-latest', Date.UTC(2026, 10, 20, 14), violations)
  const previous = createAudit('audit-previous', Date.UTC(2026, 10, 13, 14), violations.slice(0, 1))

  await page.addInitScript((tab) => {
    Object.assign(chrome, {
      devtools: {
        inspectedWindow: {
          tabId: tab.id,
          eval: (_expression: string, callback: (result: unknown) => void) =>
            callback({ title: tab.title, url: tab.url }),
        },
        network: { onNavigated: { addListener: () => {}, removeListener: () => {} } },
      },
    })
  }, inspectedTab)

  await page.goto(`chrome-extension://${extensionId}/src/popup.html`)
  // The page only stores the audits, so they cross over as plain data.
  const storedAudits: unknown[] = [latest, previous]
  // Panel state a previous test left behind (open tab, scroll) must not leak into this one.
  await page.evaluate(
    async ({ tabId, url, audits }) => {
      await chrome.storage.local.clear()
      await chrome.storage.local.set({
        auditResultsByTab: { [tabId]: audits[0] },
        auditHistoryByUrl: { [url]: audits },
      })
    },
    { tabId: inspectedTab.id, url: inspectedTab.url, audits: storedAudits },
  )
  await page.goto(`chrome-extension://${extensionId}/src/devtools-panel.html`)
}
