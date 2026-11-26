import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import type { AuditHistoryEntry, Violation } from '@/types'
import {
  compactAuditResultForStorage,
  dedupeAndSortAuditHistory,
  getAuditSiteStorageKey,
  getAuditUrlStorageKey,
  getVisibleAuditViolations,
  hydrateAuditResult,
  inheritViolationStateFromHistory,
} from '@/utils/audit-history'

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

function createAuditEntry(
  overrides: Partial<AuditHistoryEntry> & Record<string, unknown> = {},
): AuditHistoryEntry {
  const violations = overrides.violations ?? []

  return {
    id: 'audit-id',
    timestamp: 0,
    url: 'https://example.com',
    pageTitle: 'Página',
    totalViolations: violations.length,
    errors: violations.filter((violation) => violation.normativeType === 'Requisito').length,
    warnings: violations.filter((violation) => violation.normativeType === 'Recomendação').length,
    humanReviewItems: violations.filter((violation) => violation.requiresHumanReview).length,
    automatedFindings: violations.filter((violation) => !violation.requiresHumanReview).length,
    violations,
    violationsByRule: {},
    violationsBySeverity: { error: [], warning: [] },
    ...overrides,
  } as AuditHistoryEntry
}

describe('storage keys', () => {
  it('keys history by page, ignoring query string, hash and trailing slash', () => {
    assert.equal(
      getAuditUrlStorageKey('https://example.com/path#section'),
      'https://example.com/path',
    )
    assert.equal(
      getAuditUrlStorageKey('https://example.com/path?debug=1'),
      'https://example.com/path',
    )
    assert.equal(
      getAuditUrlStorageKey('https://example.com/path/?debug=1#section'),
      'https://example.com/path',
    )
    assert.equal(getAuditUrlStorageKey('https://example.com/path/a'), 'https://example.com/path/a')
    assert.equal(getAuditUrlStorageKey('https://example.com/path/b'), 'https://example.com/path/b')
  })

  it('keys site sessions by origin', () => {
    assert.equal(
      getAuditSiteStorageKey('https://example.com/path/b?debug=1'),
      'https://example.com',
    )
  })
})

describe('dedupeAndSortAuditHistory', () => {
  it('drops repeated audits and orders the rest from newest to oldest', () => {
    const history = dedupeAndSortAuditHistory(
      [
        createAuditEntry({ id: 'older', timestamp: 100 }),
        createAuditEntry({ id: 'newer', timestamp: 300 }),
        createAuditEntry({ id: 'older', timestamp: 100 }),
        createAuditEntry({ id: 'middle', timestamp: 200 }),
      ],
      10,
    )

    assert.deepEqual(
      history.map((entry) => entry.id),
      ['newer', 'middle', 'older'],
    )
  })
})

describe('getVisibleAuditViolations', () => {
  it('hides dismissed reviews', () => {
    const visible = getVisibleAuditViolations(
      createAuditEntry({
        violations: [
          createViolation({
            id: 'kept',
            requiresHumanReview: true,
            humanReviewStatus: 'confirmed',
          }),
          createViolation({
            id: 'hidden',
            requiresHumanReview: true,
            humanReviewStatus: 'dismissed',
          }),
          createViolation({
            id: 'auto',
            requiresHumanReview: false,
            humanReviewStatus: 'not_applicable',
          }),
        ],
      }),
    )

    assert.deepEqual(
      visible.map((violation) => violation.id),
      ['kept', 'auto'],
    )
  })
})

describe('inheritViolationStateFromHistory', () => {
  it('carries review decisions and notes over to the same finding in a new audit', () => {
    const result = inheritViolationStateFromHistory(
      createAuditEntry({
        id: 'current',
        violations: [
          createViolation({
            id: 'same-key',
            ruleId: 'rule-a',
            message: 'Mensagem A',
            suggestion: 'Sugestão A',
            elementSelector: '#campo-a',
            requiresHumanReview: true,
            humanReviewStatus: 'pending',
          }),
          createViolation({
            id: 'other-key',
            ruleId: 'rule-b',
            message: 'Mensagem B',
            suggestion: 'Sugestão B',
            elementSelector: '#campo-b',
            requiresHumanReview: true,
            humanReviewStatus: 'pending',
          }),
        ],
      }),
      [
        createAuditEntry({
          id: 'history-1',
          violations: [
            createViolation({
              id: 'same-key',
              ruleId: 'rule-a',
              message: 'Mensagem A',
              suggestion: 'Sugestão A',
              elementSelector: '#campo-a',
              requiresHumanReview: true,
              humanReviewStatus: 'dismissed',
              userNote: 'Não se aplica neste fluxo',
              noteUpdatedAt: 123,
            }),
          ],
        }),
      ],
    )

    assert.equal(result.violations[0].humanReviewStatus, 'dismissed')
    assert.equal(result.violations[0].userNote, 'Não se aplica neste fluxo')
    assert.equal(result.violations[0].noteUpdatedAt, 123)
    assert.equal(result.violations[0].inheritedFromHistory, true)
    assert.equal(result.violations[1].humanReviewStatus, 'pending')
    assert.equal(result.violations[1].userNote, undefined)
  })
})

describe('compactAuditResultForStorage and hydrateAuditResult', () => {
  const audit = createAuditEntry({
    id: 'with-derived-data',
    summary: { auditScore: { score: 91 } },
    violations: [
      createViolation({
        id: 'error-a',
        ruleId: 'rule-a',
        severity: 'error',
        nbrReference: '5.1.1',
        element: { nodeName: 'INPUT' } as unknown as HTMLElement,
        inheritedFromHistory: true,
      }),
      createViolation({
        id: 'warning-b',
        ruleId: 'rule-b',
        severity: 'warning',
        nbrReference: '5.3.3',
        userNote: 'Revisar com o time',
      }),
    ],
  })

  it('drops derived data and live DOM references but keeps user input', () => {
    const compacted = compactAuditResultForStorage(audit)

    assert.equal('violationsByRule' in compacted, false)
    assert.equal('violationsBySeverity' in compacted, false)
    assert.equal('summary' in compacted, false)
    assert.equal('element' in compacted.violations[0], false)
    assert.equal('inheritedFromHistory' in compacted.violations[0], false)
    assert.equal(compacted.violations[1].userNote, 'Revisar com o time')
  })

  it('rebuilds the derived groupings when reading a compacted audit', () => {
    const hydrated = hydrateAuditResult(compactAuditResultForStorage(audit))

    assert.equal(hydrated.totalViolations, 2)
    assert.equal(hydrated.violationsByRule['rule-a'].length, 1)
    assert.equal(hydrated.violationsBySeverity.error.length, 1)
    assert.equal(hydrated.violationsBySeverity.warning.length, 1)
  })
})
