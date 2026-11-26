import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'
import type { AuditResult, Rule, Violation } from '@/types'
import { compareAuditResults } from '@/utils/audit-comparison'
import { buildExportableAuditResult } from '@/utils/audit-export'
import { getVisibleAuditViolations } from '@/utils/audit-history'
import { getAuditScoreData } from '@/utils/audit-score'
import { applyFindingStatusUpdate, normalizeViolationFindingState } from '@/utils/audit-triage'

// A small catalog keeps the score arithmetic readable: two requirements in scope by default.
vi.mock('@/rules', () => {
  const rules = [
    { id: 'requirement-rule', nbrReference: '5.1.1', category: 'Totalmente Automatizável' },
    { id: 'human-rule', nbrReference: '5.2.1', category: 'Semi-Automatizável' },
    { id: 'recommendation-rule', nbrReference: '5.3.3', category: 'Totalmente Automatizável' },
    {
      id: 'manual-route',
      nbrReference: '5.4.1',
      category: 'Não Automatizável',
      verificationMode: 'manual',
    },
  ] as Rule[]

  return {
    getRunnableRules: (includeRecommendations: boolean, includeHumanReview = true) =>
      rules.filter(
        (rule) =>
          (includeRecommendations || rule.id !== 'recommendation-rule') &&
          (includeHumanReview || rule.id !== 'human-rule'),
      ),
  }
})

function createViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'violation-id',
    ruleId: 'requirement-rule',
    ruleName: 'Regra',
    nbrReference: '5.1.1',
    description: 'Descrição',
    severity: 'error',
    wcagLevel: 'A',
    automationCategory: 'Totalmente Automatizável',
    normativeType: 'Requisito',
    requiresHumanReview: false,
    humanReviewStatus: 'not_applicable',
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
    pageTitle: 'Página',
    includeRecommendations: false,
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

const confirmedHuman = applyFindingStatusUpdate(
  normalizeViolationFindingState(
    createViolation({
      id: 'human',
      ruleId: 'human-rule',
      requiresHumanReview: true,
      humanReviewStatus: 'pending',
    }),
  ),
  { status: 'confirmed' },
  3000,
)

const ignoredAudit = createAuditResult({
  violations: [
    createViolation({
      id: 'ignored-score',
      findingStatus: 'ignored',
      humanReviewStatus: 'dismissed',
      ignoreReason: 'false_positive',
    }),
  ],
})

describe('normalizeViolationFindingState', () => {
  it('maps legacy review statuses to finding statuses', () => {
    const pending = normalizeViolationFindingState(
      createViolation({ requiresHumanReview: true, humanReviewStatus: 'pending' }),
    )
    const notApplicable = normalizeViolationFindingState(
      createViolation({ humanReviewStatus: 'not_applicable' }),
    )
    const confirmed = normalizeViolationFindingState(
      createViolation({ requiresHumanReview: true, humanReviewStatus: 'confirmed' }),
    )
    const dismissed = normalizeViolationFindingState(
      createViolation({ requiresHumanReview: true, humanReviewStatus: 'dismissed' }),
    )

    assert.equal(pending.findingStatus, 'open')
    assert.equal(pending.findingOrigin, 'automatic')
    assert.equal(notApplicable.findingStatus, 'open')
    assert.equal(confirmed.findingStatus, 'confirmed')
    assert.equal(dismissed.findingStatus, 'ignored')
    assert.equal(dismissed.ignoreReason, 'false_positive')
  })
})

describe('applyFindingStatusUpdate', () => {
  it('ignores an automatic finding with a reason and a trimmed note, and reopens it', () => {
    const ignored = applyFindingStatusUpdate(
      normalizeViolationFindingState(createViolation()),
      {
        status: 'ignored',
        ignoreReason: 'accepted_risk',
        ignoreNote: '  Aceito no contexto atual.  ',
      },
      1000,
    )

    assert.equal(ignored.findingStatus, 'ignored')
    assert.equal(ignored.humanReviewStatus, 'dismissed')
    assert.equal(ignored.ignoreReason, 'accepted_risk')
    assert.equal(ignored.ignoreNote, 'Aceito no contexto atual.')
    assert.equal(ignored.findingStatusUpdatedAt, 1000)

    const reopened = applyFindingStatusUpdate(ignored, { status: 'open' }, 2000)

    assert.equal(reopened.findingStatus, 'open')
    assert.equal(reopened.humanReviewStatus, 'not_applicable')
    assert.equal(reopened.ignoreReason, undefined)
    assert.equal(reopened.ignoreNote, undefined)
    assert.equal(reopened.findingStatusUpdatedAt, 2000)
  })

  it('confirms a human review and returns it to pending when reopened', () => {
    assert.equal(confirmedHuman.findingStatus, 'confirmed')
    assert.equal(confirmedHuman.humanReviewStatus, 'confirmed')

    const reopened = applyFindingStatusUpdate(confirmedHuman, { status: 'open' }, 4000)

    assert.equal(reopened.findingStatus, 'open')
    assert.equal(reopened.humanReviewStatus, 'pending')
  })
})

describe('triage in the score', () => {
  it('leaves ignored findings out of the score but counts them', () => {
    const score = getAuditScoreData(ignoredAudit)

    assert.equal(score.violatedRequirementRules, 0)
    assert.equal(score.activeOccurrenceCount, 0)
    assert.equal(score.ignoredFindingCount, 1)
  })

  it('penalises a pending review only in the conservative score', () => {
    const score = getAuditScoreData(
      createAuditResult({
        violations: [
          createViolation({
            id: 'human-open',
            ruleId: 'human-rule',
            requiresHumanReview: true,
            humanReviewStatus: 'pending',
          }),
        ],
      }),
    )

    assert.equal(score.totalRequirementRules, 2)
    assert.equal(score.violatedRequirementRules, 1)
    assert.equal(score.confirmedViolatedRequirementRules, 0)
    assert.equal(score.activeOccurrenceCount, 1)
    assert.equal(score.pendingHumanReviewItems, 1)
    assert.equal(score.isProvisional, true)
    assert.equal(score.conservativeScore, 50)
    assert.equal(score.confirmedScore, 100)
  })

  it('counts a confirmed review in both limits', () => {
    const score = getAuditScoreData(createAuditResult({ violations: [confirmedHuman] }))

    assert.equal(score.violatedRequirementRules, 1)
    assert.equal(score.confirmedViolatedRequirementRules, 1)
    assert.equal(score.confirmedFindingCount, 1)
  })
})

describe('triage in views, exports and comparisons', () => {
  it('hides ignored findings from the list but keeps them in the export', () => {
    const exported = buildExportableAuditResult(ignoredAudit)

    assert.deepEqual(getVisibleAuditViolations(ignoredAudit), [])
    assert.equal(exported.audit.violations.length, 1)
    assert.equal(exported.audit.violations[0].findingStatus, 'ignored')
    assert.equal(exported.summary.findings.ignored, 1)
  })

  it('reports ignoring a finding as a state change, not a resolution', () => {
    const finding = {
      id: 'same',
      ruleId: 'requirement-rule',
      message: 'Mesmo achado',
      suggestion: 'Corrigir',
    }
    const summary = compareAuditResults(
      createAuditResult({
        id: 'baseline',
        timestamp: 1000,
        violations: [createViolation(finding)],
      }),
      createAuditResult({
        id: 'target',
        timestamp: 2000,
        violations: [
          createViolation({
            ...finding,
            findingStatus: 'ignored',
            humanReviewStatus: 'dismissed',
            ignoreReason: 'false_positive',
          }),
        ],
      }),
    )

    assert.equal(summary.resolvedViolations.length, 0)
    assert.equal(summary.stateChangedViolations.length, 1)
  })
})
