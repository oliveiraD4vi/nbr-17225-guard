import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'
import { t } from '@/i18n'
import type { AuditResult, Violation } from '@/types'
import {
  getAuditHistoryForSite,
  getAuditResult,
  parseImportedAuditReport,
} from '@/utils/audit-engine'

function createViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'violation-id',
    ruleId: 'rule-id',
    ruleName: 'Regra',
    nbrReference: '5.1.1',
    description: 'Descrição',
    severity: 'error',
    wcagLevel: 'A',
    automationCategory: 'Semi-Automatizável',
    requiresHumanReview: false,
    message: 'Mensagem',
    snippet: '<button>Enviar</button>',
    suggestion: 'Sugestão',
    remediationAdvice: 'Correção',
    customId: 'custom-id',
    ...overrides,
  } as Violation
}

function createAuditResult(overrides: Partial<AuditResult> = {}): AuditResult {
  const violations = overrides.violations ?? []

  return {
    id: 'audit-id',
    timestamp: 0,
    url: 'https://example.com',
    pageTitle: 'Pagina',
    totalViolations: violations.length,
    errors: violations.filter((violation) => violation.normativeType === 'Requisito').length,
    warnings: violations.filter((violation) => violation.normativeType === 'Recomendação').length,
    humanReviewItems: violations.filter((violation) => violation.requiresHumanReview).length,
    automatedFindings: violations.filter((violation) => !violation.requiresHumanReview).length,
    violations,
    violationsByRule: {},
    violationsBySeverity: { error: [], warning: [] },
    ...overrides,
  } as AuditResult
}

describe('parseImportedAuditReport', () => {
  it('reads a report exported with the audit wrapper', () => {
    const imported = parseImportedAuditReport({
      audit: {
        timestamp: '1717351200000',
        url: 'https://example.com/checkout#resumo',
        pageTitle: 'Checkout',
        includeRecommendations: true,
        totalViolations: 1,
        errors: 1,
        warnings: 0,
        humanReviewItems: 1,
        automatedFindings: 0,
        violations: [createViolation({ id: 'human-review-item', requiresHumanReview: true })],
        summary: { auditScore: { score: 76 } },
      },
    })

    assert.equal(imported.url, 'https://example.com/checkout#resumo')
    assert.equal(imported.timestamp, 1717351200000)
    assert.equal(imported.id, 'https://example.com/checkout|1717351200000')
    assert.equal(imported.includeRecommendations, true)
    assert.equal(imported.violations.length, 1)
    assert.equal(imported.violations[0].humanReviewStatus, 'pending')
    assert.equal(imported.violations[0].normativeType, 'Requisito')
  })

  it('reads a bare audit result', () => {
    const imported = parseImportedAuditReport({
      timestamp: 1717351300000,
      url: 'https://example.com/relatorio',
      totalViolations: 1,
      errors: 0,
      warnings: 1,
      humanReviewItems: 0,
      automatedFindings: 1,
      violations: [
        createViolation({ id: 'raw-entry', nbrReference: '7.3.2', severity: 'warning' }),
      ],
    })

    assert.equal(imported.id, 'https://example.com/relatorio|1717351300000')
    assert.equal(imported.violations[0].humanReviewStatus, 'not_applicable')
    assert.equal(imported.totalViolations, 1)
  })

  it('rejects payloads that are not audit reports', () => {
    const invalid = { message: t('engine.invalidImportReport') }

    assert.throws(
      () => parseImportedAuditReport({ audit: { timestamp: 'abc', url: '', violations: [] } }),
      invalid,
    )
    assert.throws(() => parseImportedAuditReport({ foo: 'bar' }), invalid)
  })
})

describe('stored audits', () => {
  const storageData = {
    auditResultsByTab: {
      7: createAuditResult({ id: 'cached-a', url: 'https://example.com/a?source=cache#old' }),
    },
    auditHistoryByUrl: {
      'https://example.com/a': [
        createAuditResult({ id: 'current-page', timestamp: 4000, url: 'https://example.com/a' }),
      ],
      'https://example.com/rules.html': [
        createAuditResult({
          id: 'rules-old',
          timestamp: 1000,
          url: 'https://example.com/rules.html',
        }),
        createAuditResult({
          id: 'rules-new',
          timestamp: 3000,
          url: 'https://example.com/rules.html?debug=1',
        }),
      ],
      'https://example.com/privacy.html': [
        createAuditResult({
          id: 'privacy',
          timestamp: 2000,
          url: 'https://example.com/privacy.html#top',
        }),
      ],
      'https://other.example.com/rules.html': [
        createAuditResult({
          id: 'other-origin',
          timestamp: 5000,
          url: 'https://other.example.com/rules.html',
        }),
      ],
    },
  }

  function stubStorage() {
    vi.stubGlobal('chrome', { storage: { local: { get: async () => storageData } } })
  }

  it("returns a tab's cached audit only while the tab stays on the same page", async () => {
    stubStorage()

    const sameTab = await getAuditResult(7, 'https://example.com/a?source=current#new')
    assert.equal(sameTab?.id, 'cached-a')
    assert.equal(await getAuditResult(7, 'https://example.com/b'), null)
  })

  it('lists the latest audit of every other page on the same origin', async () => {
    stubStorage()

    const siteHistory = await getAuditHistoryForSite('https://example.com/a?utm=1#hero')
    assert.deepEqual(
      siteHistory.map((entry) => entry.id),
      ['rules-new', 'privacy'],
    )
  })
})
