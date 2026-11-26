import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'
import type { AuditHistoryEntry, AuditResult, Violation } from '@/types'
import { compareAuditResults } from '@/utils/audit-comparison'
import { buildExportableAuditResult } from '@/utils/audit-export'
import { inheritViolationStateFromHistory } from '@/utils/audit-history'
import {
  getReportSnapshot,
  REPORT_SNAPSHOTS_STORAGE_KEY,
  saveReportSnapshot,
} from '@/utils/report-snapshots'

// The score is not under test here; an empty catalog keeps the full rule set out of the import.
vi.mock('@/rules', () => ({ getRunnableRules: () => [] }))

function createViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'image-alt-text-1',
    ruleId: 'image-alt-text',
    ruleName: 'Texto alternativo em imagem',
    nbrReference: '5.2.1',
    description: 'Imagem precisa ter alternativa textual adequada.',
    severity: 'error',
    wcagLevel: 'A',
    automationCategory: 'Totalmente Automatizável',
    normativeType: 'Requisito',
    requiresHumanReview: false,
    humanReviewStatus: 'not_applicable',
    findingOrigin: 'automatic',
    findingStatus: 'open',
    message: 'Imagem sem texto alternativo suficiente.',
    snippet: '<img src="produto.png" alt="">',
    suggestion: 'Descreva a função ou conteúdo relevante da imagem.',
    remediationAdvice: 'Ajuste o atributo alt ou o nome acessível equivalente.',
    customId: 'image-alt-text-1',
    elementSelector: 'img.product',
    elementTagName: 'img',
    alternativeTextReview: {
      currentSource: 'alt',
      currentText: '',
      targetAttribute: 'alt',
      proposedText: '',
    },
    ...overrides,
  } as Violation
}

function createAuditResult(overrides: Partial<AuditHistoryEntry> = {}): AuditHistoryEntry {
  const violations = overrides.violations ?? []

  return {
    id: 'audit-id',
    timestamp: 1700000000000,
    url: 'https://example.com/produto',
    pageTitle: 'Produto',
    includeRecommendations: true,
    includeHumanReview: true,
    totalViolations: violations.length,
    errors: violations.length,
    warnings: 0,
    humanReviewItems: 0,
    automatedFindings: violations.length,
    violations,
    violationsByRule: {},
    violationsBySeverity: { error: violations, warning: [] },
    ...overrides,
  } as AuditHistoryEntry
}

// The page now reads its text from aria-label, while the history holds a proposal made when the
// image only had an empty alt.
const withProposal = inheritViolationStateFromHistory(
  createAuditResult({
    id: 'current',
    violations: [
      createViolation({
        alternativeTextReview: {
          currentSource: 'aria-label',
          currentText: 'Foto do produto',
          targetAttribute: 'aria-label',
          proposedText: '',
        },
      }),
    ],
  }),
  [
    createAuditResult({
      id: 'history',
      violations: [
        createViolation({
          alternativeTextReview: {
            currentSource: 'alt',
            currentText: '',
            targetAttribute: 'alt',
            proposedText: 'Tênis azul visto de lado',
            updatedAt: 1700000001000,
          },
        }),
      ],
    }),
  ],
)

describe('alternative text proposals', () => {
  it('keep the current page text and inherit the proposal from history', () => {
    const review = withProposal.violations[0].alternativeTextReview

    assert.equal(review?.currentSource, 'aria-label')
    assert.equal(review?.currentText, 'Foto do produto')
    assert.equal(review?.proposedText, 'Tênis azul visto de lado')
    assert.equal(withProposal.violations[0].inheritedFromHistory, true)
  })

  it('are counted and kept in the export', () => {
    const exported = buildExportableAuditResult(withProposal)

    assert.equal(exported.summary.findings.alternativeTextReviews, 1)
    assert.equal(
      exported.audit.violations[0].alternativeTextReview?.proposedText,
      'Tênis azul visto de lado',
    )
  })

  it('are counted on each side of a comparison', () => {
    const comparison = compareAuditResults(
      createAuditResult({ id: 'baseline', violations: [createViolation()] }),
      withProposal,
    )

    assert.equal(comparison.baselineAlternativeTextReviewCount, 0)
    assert.equal(comparison.targetAlternativeTextReviewCount, 1)
    assert.equal(comparison.alternativeTextReviewsDeltaPercentage, 100)
  })
})

describe('report snapshots', () => {
  it('store the audit without live DOM references and read it back', async () => {
    const storage: Record<string, unknown> = {}
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          async get(key: unknown) {
            return typeof key === 'string' ? { [key]: storage[key] } : {}
          },
          async set(patch: Record<string, unknown>) {
            Object.assign(storage, patch)
          },
        },
      },
    })

    const snapshot = await saveReportSnapshot(withProposal)
    const stored = storage[REPORT_SNAPSHOTS_STORAGE_KEY] as Record<
      string,
      { auditResult: AuditResult }
    >

    assert.ok(stored[snapshot.id])
    assert.equal('element' in stored[snapshot.id].auditResult.violations[0], false)

    const loaded = await getReportSnapshot(snapshot.id)

    assert.equal(loaded?.id, withProposal.id)
    assert.equal(
      loaded?.violations[0].alternativeTextReview?.proposedText,
      'Tênis azul visto de lado',
    )
  })
})
