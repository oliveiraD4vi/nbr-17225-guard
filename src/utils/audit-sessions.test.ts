import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import type { PageAuditContext } from '@/types'
import { buildJourneyReviewCandidates, buildSiteReviewCandidates } from '@/utils/audit-sessions'

const baseContext: PageAuditContext = {
  navigationSignatures: ['início|produtos|contato'],
  helpSignatures: ['ajuda'],
  locationMechanisms: ['navegação'],
  controlActions: [{ action: '/salvar', name: 'salvar' }],
  criticalActions: [],
  formFieldKeys: [],
  hasReviewCue: false,
}

describe('buildSiteReviewCandidates', () => {
  it('flags inconsistent navigation, help and controls across pages of a site', () => {
    const candidates = buildSiteReviewCandidates([
      { url: 'https://example.com/a', auditedAt: 1, context: baseContext },
      {
        url: 'https://example.com/b',
        auditedAt: 2,
        context: {
          ...baseContext,
          navigationSignatures: ['início|contato|produtos'],
          helpSignatures: [],
          controlActions: [{ action: '/salvar', name: 'gravar' }],
        },
      },
    ])

    assert.deepEqual(
      new Set(candidates.map((candidate) => candidate.nbrReference)),
      new Set(['5.7.13', '5.7.15', '5.7.16', '5.8.5']),
    )
  })
})

describe('buildJourneyReviewCandidates', () => {
  it('flags critical actions without review and data asked for twice', () => {
    const candidates = buildJourneyReviewCandidates([
      {
        id: 'step-1',
        url: 'https://example.com/etapa-1',
        label: 'Dados',
        recordedAt: 1,
        evidenceSelectors: [],
        context: { ...baseContext, formFieldKeys: ['email:e-mail'] },
      },
      {
        id: 'step-2',
        url: 'https://example.com/etapa-2',
        label: 'Pagamento',
        recordedAt: 2,
        evidenceSelectors: [],
        context: { ...baseContext, criticalActions: ['pagar'], formFieldKeys: ['email:e-mail'] },
      },
    ])

    assert.deepEqual(
      new Set(candidates.map((candidate) => candidate.nbrReference)),
      new Set(['5.9.12', '5.9.15']),
    )
  })
})
