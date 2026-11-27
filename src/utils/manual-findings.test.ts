import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'
import type { AuditHistoryEntry, ManualFindingDraft, Rule, Violation } from '@/types'
import { createManualViolation } from '@/utils/violation-factory'
import {
  getManualFindingReapplyCandidates,
  mergeResolvedManualFindings,
} from '@/utils/audit-engine'
import { buildExportableAuditResult } from '@/utils/audit-export'
import { getDisplayAuditResult } from '@/utils/audit-history'
import { getAuditScoreData } from '@/utils/audit-score'

vi.mock('@/rules', () => {
  const rules = [
    { id: 'manual-rule', nbrReference: '5.1.1', category: 'Não Automatizável' },
    { id: 'automatic-rule', nbrReference: '5.1.2', category: 'Totalmente Automatizável' },
    { id: 'recommendation-rule', nbrReference: '5.3.3', category: 'Totalmente Automatizável' },
  ] as Rule[]

  return {
    getRunnableRules: (includeRecommendations: boolean, includeHumanReview = true) =>
      rules.filter(
        (rule) =>
          (includeRecommendations || rule.id !== 'recommendation-rule') &&
          (includeHumanReview || rule.category !== 'Não Automatizável'),
      ),
  }
})

const manualRule = {
  id: 'manual-rule',
  nbrReference: '5.1.1',
  name: 'Regra manual',
  description: 'Descrição da regra manual',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Não Automatizável',
} as Rule

const manualDraft = {
  tabId: 7,
  selector: '#target',
  tagName: 'button',
  snippet: '<button id="target">Enviar</button>',
  accessibleName: 'Enviar formulário',
  visibleText: 'Enviar',
  url: 'https://example.com/form',
  pageTitle: 'Formulário',
  selectedAt: 1234,
} as ManualFindingDraft

function createAuditResult(overrides: Partial<AuditHistoryEntry> = {}): AuditHistoryEntry {
  const violations = overrides.violations ?? []

  return {
    id: 'audit-id',
    timestamp: 1000,
    url: 'https://example.com/form',
    pageTitle: 'Formulário',
    includeRecommendations: false,
    includeHumanReview: false,
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

const manualViolation = createManualViolation(manualRule, {
  draft: manualDraft,
  message: '  Botão sem indicação suficiente.  ',
  suggestion: '  Ajustar identificação do botão.  ',
  remediationAdvice: '  Revise o texto, rótulo e contexto do controle.  ',
  userNote: '  Evidência registrada na avaliação.  ',
  createdAt: 5000,
})
const manualAudit = createAuditResult({ violations: [manualViolation] })

describe('createManualViolation', () => {
  it('records a confirmed manual finding with trimmed text and the selected element', () => {
    assert.equal(manualViolation.findingOrigin, 'manual')
    assert.equal(manualViolation.findingStatus, 'confirmed')
    assert.equal(manualViolation.humanReviewStatus, 'confirmed')
    assert.equal(manualViolation.findingStatusUpdatedAt, 5000)
    assert.equal(manualViolation.message, 'Botão sem indicação suficiente.')
    assert.equal(manualViolation.suggestion, 'Ajustar identificação do botão.')
    assert.equal(
      manualViolation.remediationAdvice,
      'Revise o texto, rótulo e contexto do controle.',
    )
    assert.equal(manualViolation.userNote, 'Evidência registrada na avaliação.')
    assert.equal(manualViolation.elementSelector, '#target')
    assert.equal(manualViolation.elementAccessibleName, 'Enviar formulário')
    assert.equal(manualViolation.elementVisibleText, 'Enviar')
  })
})

describe('manual findings in the audit', () => {
  it('count as confirmed failures in the score', () => {
    const score = getAuditScoreData(manualAudit)

    assert.equal(score.manualFindingCount, 1)
    assert.equal(score.confirmedFindingCount, 1)
    assert.equal(score.activeOccurrenceCount, 1)
    assert.equal(score.violatedRequirementRules, 1)
    assert.equal(score.failedRequirementWeight, 2)
  })

  it('stay visible when human review is out of scope', () => {
    const displayed = getDisplayAuditResult(manualAudit, false, false)

    assert.equal(displayed.violations.length, 1)
    assert.equal(displayed.violations[0].id, manualViolation.id)
  })

  it('are exported as confirmed and actionable', () => {
    const exported = buildExportableAuditResult(manualAudit)

    assert.equal(exported.audit.violations.length, 1)
    assert.equal(exported.audit.violations[0].findingOrigin, 'manual')
    assert.equal(exported.audit.violations[0].findingStatus, 'confirmed')
    assert.equal(exported.summary.findings.actionable, 1)
    assert.equal(exported.summary.findings.confirmed, 1)
  })
})

describe('reapplying manual findings to a new audit', () => {
  const automaticViolation: Violation = {
    ...manualViolation,
    id: 'automatic',
    ruleId: 'automatic-rule',
    findingOrigin: 'automatic',
    findingStatus: 'open',
    humanReviewStatus: 'not_applicable',
    elementSelector: '#automatic',
  }
  const candidates = getManualFindingReapplyCandidates([
    createAuditResult({
      id: 'newer-history',
      timestamp: 2000,
      violations: [manualViolation, automaticViolation],
    }),
    createAuditResult({
      id: 'older-history',
      timestamp: 1000,
      violations: [{ ...manualViolation, message: 'Versão antiga do achado' }],
    }),
  ])
  const rerun = createAuditResult({ id: 'rerun', timestamp: 3000, violations: [] })

  it('takes only manual findings, in their most recent version', () => {
    assert.equal(candidates.length, 1)
    assert.equal(candidates[0].id, manualViolation.id)
    assert.equal(candidates[0].message, manualViolation.message)
  })

  it('refreshes the element of a finding whose selector still matches', () => {
    const merged = mergeResolvedManualFindings(rerun, candidates, [
      {
        id: manualViolation.id,
        selector: '#target',
        tagName: 'button',
        snippet: '<button id="target">Enviar agora</button>',
        accessibleName: 'Enviar agora',
        visibleText: 'Enviar agora',
      },
    ])

    assert.equal(merged.violations.length, 1)
    assert.equal(merged.violations[0].id, manualViolation.id)
    assert.equal(merged.violations[0].snippet, '<button id="target">Enviar agora</button>')
    assert.equal(merged.violations[0].elementVisibleText, 'Enviar agora')
    assert.equal(merged.violations[0].inheritedFromHistory, true)
  })

  it('drops findings whose element is gone', () => {
    assert.equal(mergeResolvedManualFindings(rerun, candidates, []).violations.length, 0)
  })

  it('does not duplicate a finding the audit already has', () => {
    const merged = mergeResolvedManualFindings(
      createAuditResult({ violations: [manualViolation] }),
      candidates,
      [
        {
          id: manualViolation.id,
          selector: '#target',
          tagName: 'button',
          snippet: '<button id="target">Enviar agora</button>',
        },
      ],
    )

    assert.equal(merged.violations.length, 1)
  })
})
