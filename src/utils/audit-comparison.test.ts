import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import type { AuditResult, Violation } from '@/types'
import {
  compareAuditResults,
  getConfirmedFindingCount,
  getDismissedHumanReviewCount,
  getIgnoredFindingCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison'

function createViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'violation-id',
    ruleId: 'rule-id',
    ruleName: 'Regra',
    nbrReference: '5.0.0',
    description: 'Descrição',
    severity: 'warning',
    wcagLevel: 'A',
    automationCategory: 'Semi-Automatizável',
    normativeType: 'Requisito',
    requiresHumanReview: false,
    humanReviewStatus: 'not_applicable',
    message: 'Mensagem',
    snippet: '',
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
    pageTitle: 'Página',
    includeRecommendations: true,
    includeHumanReview: true,
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

describe('compareAuditResults', () => {
  const baseline = createAuditResult({
    id: 'baseline',
    timestamp: 1000,
    violations: [
      createViolation({
        id: 'open-persistent',
        ruleId: 'rule-persistent',
        message: 'Persistente',
        suggestion: 'Corrigir persistente',
      }),
      createViolation({
        id: 'review-ignored',
        ruleId: 'rule-ignored',
        message: 'Ignorado',
        suggestion: 'Não deve aparecer nos acionáveis',
        requiresHumanReview: true,
        humanReviewStatus: 'dismissed',
      }),
      createViolation({
        id: 'review-confirmed',
        ruleId: 'rule-confirmed',
        message: 'Confirmado',
        suggestion: 'Corrigir confirmado',
        requiresHumanReview: true,
        humanReviewStatus: 'confirmed',
        userNote: 'Confirmado manualmente',
      }),
    ],
  })

  const target = createAuditResult({
    id: 'target',
    timestamp: 2000,
    violations: [
      createViolation({
        id: 'open-persistent',
        ruleId: 'rule-persistent',
        message: 'Persistente',
        suggestion: 'Corrigir persistente',
      }),
      createViolation({
        id: 'new-open',
        ruleId: 'rule-new',
        message: 'Novo problema',
        suggestion: 'Corrigir novo',
      }),
      createViolation({
        id: 'review-pending',
        ruleId: 'rule-pending',
        message: 'Pendente',
        suggestion: 'Revisar pendente',
        requiresHumanReview: true,
        humanReviewStatus: 'pending',
      }),
    ],
  })

  it('separates persistent, new and resolved findings and counts reviews on each side', () => {
    const summary = compareAuditResults(baseline, target)

    assert.equal(summary.baselineId, 'baseline')
    assert.equal(summary.targetId, 'target')
    assert.equal(summary.persistentViolations.length, 1)
    assert.equal(summary.newViolations.length, 2)
    assert.equal(summary.resolvedViolations.length, 1)
    assert.equal(summary.stateChangedViolations.length, 0)
    assert.equal(summary.baselineOpenCount, 2)
    assert.equal(summary.targetOpenCount, 3)
    assert.equal(summary.baselineConfirmedReviews, 1)
    assert.equal(summary.baselineDismissedReviews, 1)
    assert.equal(summary.baselinePendingReviews, 0)
    assert.equal(summary.targetConfirmedReviews, 0)
    assert.equal(summary.targetDismissedReviews, 0)
    assert.equal(summary.targetPendingReviews, 1)
    assert.equal(summary.baselineNoteCount, 1)
    assert.equal(summary.targetNoteCount, 0)
  })

  it('counts findings by triage state', () => {
    assert.equal(getConfirmedFindingCount(baseline), 1)
    assert.equal(getIgnoredFindingCount(baseline), 1)
    assert.equal(getDismissedHumanReviewCount(baseline), 1)
    assert.equal(getPendingHumanReviewCount(target), 1)
  })

  describe('triage changes', () => {
    const openBaseline = createAuditResult({
      id: 'open-baseline',
      timestamp: 3000,
      violations: [
        createViolation({
          id: 'same-finding',
          ruleId: 'rule-state',
          message: 'Mesma violação',
          suggestion: 'Corrigir',
        }),
      ],
    })
    const ignoredTarget = createAuditResult({
      id: 'ignored-target',
      timestamp: 4000,
      violations: [
        createViolation({
          id: 'same-finding',
          ruleId: 'rule-state',
          message: 'Mesma violação',
          suggestion: 'Corrigir',
          findingStatus: 'ignored',
          ignoreReason: 'false_positive',
          humanReviewStatus: 'dismissed',
        }),
      ],
    })

    it('does not count ignoring a finding as a technical improvement', () => {
      const summary = compareAuditResults(openBaseline, ignoredTarget)

      assert.equal(summary.resolvedViolations.length, 0)
      assert.equal(summary.stateChangedViolations.length, 1)
      assert.equal(summary.targetOpenCount, 0)
      assert.equal(summary.targetDismissedReviews, 1)
      assert.equal(summary.technicalTrend, 'unchanged')
      assert.equal(summary.ignoredSinceBaseline.length, 1)
    })

    it('does not count reopening a finding as a regression', () => {
      const summary = compareAuditResults(ignoredTarget, openBaseline)

      assert.equal(summary.technicalTrend, 'unchanged')
      assert.equal(summary.reopenedSinceBaseline.length, 1)
      assert.equal(summary.newViolations.length, 0)
    })
  })

  it('reports a mixed trend when findings both appear and disappear', () => {
    const summary = compareAuditResults(
      createAuditResult({
        id: 'mixed-baseline',
        violations: [createViolation({ id: 'removed-item', ruleId: 'removed-rule' })],
      }),
      createAuditResult({
        id: 'mixed-target',
        violations: [createViolation({ id: 'new-item', ruleId: 'new-rule' })],
      }),
    )

    assert.equal(summary.technicalTrend, 'mixed')
    assert.equal(summary.newViolations.length, 1)
    assert.equal(summary.noLongerDetectedViolations.length, 1)
    assert.equal(summary.resolvedViolations, summary.noLongerDetectedViolations)
  })

  it('compares only the scope both audits share', () => {
    const summary = compareAuditResults(
      createAuditResult({
        id: 'partial-baseline',
        includeRecommendations: true,
        violations: [
          createViolation({ id: 'requirement-removed', ruleId: 'requirement-removed' }),
          createViolation({
            id: 'recommendation-outside-scope',
            ruleId: 'recommendation-outside-scope',
            normativeType: 'Recomendação',
          }),
        ],
      }),
      createAuditResult({ id: 'partial-target', includeRecommendations: false, violations: [] }),
    )

    assert.equal(summary.comparisonScope.mode, 'partial')
    assert.deepEqual(summary.comparisonScope.excluded, ['recommendations'])
    assert.equal(summary.noLongerDetectedViolations.length, 1)
    assert.equal(summary.technicalTrend, 'improvement')
  })

  it('treats audits saved before scope flags existed as requirements only', () => {
    const summary = compareAuditResults(
      createAuditResult({
        id: 'legacy-baseline',
        includeRecommendations: undefined,
        includeHumanReview: undefined,
        violations: [
          createViolation({ id: 'legacy-requirement', ruleId: 'legacy-requirement' }),
          createViolation({
            id: 'legacy-recommendation',
            ruleId: 'legacy-recommendation',
            normativeType: 'Recomendação',
          }),
          createViolation({
            id: 'legacy-contextual',
            ruleId: 'legacy-contextual',
            requiresHumanReview: true,
          }),
        ],
      }),
      createAuditResult({
        id: 'legacy-target',
        includeRecommendations: true,
        includeHumanReview: false,
        violations: [],
      }),
    )

    assert.equal(summary.comparisonScope.mode, 'partial')
    assert.equal(summary.comparisonScope.includeRecommendations, false)
    assert.equal(summary.comparisonScope.includeHumanReview, false)
    assert.deepEqual(summary.comparisonScope.excluded, ['recommendations', 'contextual'])
    assert.equal(summary.noLongerDetectedViolations.length, 1)
  })

  it('lists which review fields changed without calling it a technical change', () => {
    const summary = compareAuditResults(
      createAuditResult({
        id: 'review-change-baseline',
        violations: [
          createViolation({
            id: 'review-change',
            userNote: 'Texto anterior',
            alternativeTextReview: {
              currentSource: 'alt',
              currentText: '',
              proposedText: 'Descrição anterior',
              targetAttribute: 'alt',
              updatedAt: 100,
            },
            userContrastOverride: {
              foregroundHex: '#000000',
              backgroundHex: '#ffffff',
              updatedAt: 100,
            },
          }),
        ],
      }),
      createAuditResult({
        id: 'review-change-target',
        violations: [
          createViolation({
            id: 'review-change',
            userNote: 'Texto atualizado',
            alternativeTextReview: {
              currentSource: 'alt',
              currentText: '',
              proposedText: 'Descrição atualizada',
              targetAttribute: 'alt',
              updatedAt: 200,
            },
            userContrastOverride: {
              foregroundHex: '#111111',
              backgroundHex: '#ffffff',
              updatedAt: 200,
            },
          }),
        ],
      }),
    )

    assert.deepEqual(summary.reviewChangedViolations[0].changedFields, [
      'user_note',
      'alternative_text',
      'contrast',
    ])
    assert.equal(summary.technicalTrend, 'unchanged')
  })

  it('ignores a contrast override whose only change is its timestamp', () => {
    const contrast = { foregroundHex: '#111111', backgroundHex: '#ffffff' }
    const summary = compareAuditResults(
      createAuditResult({
        id: 'timestamp-baseline',
        violations: [
          createViolation({
            id: 'timestamp-only',
            userContrastOverride: { ...contrast, updatedAt: 100 },
          }),
        ],
      }),
      createAuditResult({
        id: 'timestamp-target',
        violations: [
          createViolation({
            id: 'timestamp-only',
            userContrastOverride: { ...contrast, updatedAt: 200 },
          }),
        ],
      }),
    )

    assert.equal(summary.reviewChangedViolations.length, 0)
    assert.equal(summary.technicalTrend, 'unchanged')
  })
})
