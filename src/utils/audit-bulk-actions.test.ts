import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import type { Violation } from '@/types'
import {
  areSimilarViolations,
  countSimilarViolations,
  getViolationSimilarityKey,
} from '@/utils/audit-bulk-actions'

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
    findingOrigin: 'automatic',
    findingStatus: 'open',
    message: 'Mensagem',
    snippet: '<button>Enviar</button>',
    suggestion: 'Sugestão',
    remediationAdvice: 'Correção',
    elementTagName: 'button',
    elementSelector: '#target',
    customId: 'custom-id',
    ...overrides,
  } as Violation
}

function createContrastDetails(
  overrides: Partial<NonNullable<Violation['contrastDetails']>> = {},
): Violation['contrastDetails'] {
  return {
    foregroundHex: '#777777',
    backgroundHex: '#ffffff',
    comparisonHex: '#777777',
    context: 'text',
    measuredRatio: 3.2,
    minimumRatio: 4.5,
    ...overrides,
  }
}

describe('contrast findings', () => {
  const base = createViolation({
    id: 'contrast-1',
    ruleId: 'contrast',
    message: 'Contraste insuficiente',
    elementSelector: '.steps li:nth-child(1)',
    contrastDetails: createContrastDetails(),
  })
  const similar = createViolation({
    id: 'contrast-2',
    ruleId: 'contrast',
    message: 'Texto diferente não altera o lote de contraste',
    elementSelector: '.steps li:nth-child(2)',
    contrastDetails: createContrastDetails({ foregroundHex: '#777777', backgroundHex: '#FFFFFF' }),
  })
  const differentColor = createViolation({
    id: 'contrast-3',
    ruleId: 'contrast',
    elementSelector: '.steps li:nth-child(3)',
    contrastDetails: createContrastDetails({ foregroundHex: '#666666' }),
  })

  it('are similar when they share the same colour pair, whatever the message', () => {
    assert.equal(areSimilarViolations(base, similar), true)
    assert.equal(areSimilarViolations(base, differentColor), false)
    assert.equal(getViolationSimilarityKey(base), getViolationSimilarityKey(similar))
  })

  it('are counted only against findings of the same colour pair', () => {
    const unrelated = createViolation({ id: 'generic-1', ruleId: 'label' })
    assert.equal(countSimilarViolations(base, [base, similar, differentColor, unrelated]), 2)
  })
})

describe('other findings', () => {
  const base = createViolation({
    id: 'generic-1',
    ruleId: 'label',
    message: 'Campo sem rótulo',
    suggestion: 'Adicione um rótulo',
    remediationAdvice: 'Associe label e campo.',
    elementTagName: 'input',
    elementSelector: '#email',
  })
  const similar = createViolation({
    id: 'generic-2',
    ruleId: 'label',
    message: '  Campo sem rótulo  ',
    suggestion: 'Adicione um rótulo',
    remediationAdvice: 'Associe label e campo.',
    elementTagName: 'INPUT',
    elementSelector: '#telefone',
  })
  const differentElement = createViolation({
    id: 'generic-3',
    ruleId: 'label',
    message: 'Campo sem rótulo',
    suggestion: 'Adicione um rótulo',
    remediationAdvice: 'Associe label e campo.',
    elementTagName: 'button',
  })
  const ignoredSimilar = createViolation({
    ...similar,
    id: 'generic-ignored',
    findingStatus: 'ignored',
    ignoreReason: 'duplicate',
  })

  it('are similar when rule, text and element type match, ignoring case and spacing', () => {
    assert.equal(areSimilarViolations(base, similar), true)
    assert.equal(areSimilarViolations(base, differentElement), false)
  })

  it('can be counted with a filter, such as leaving ignored findings out', () => {
    assert.equal(countSimilarViolations(base, [base, similar, ignoredSimilar]), 3)
    assert.equal(
      countSimilarViolations(
        base,
        [base, similar, ignoredSimilar],
        (violation) => violation.findingStatus !== 'ignored',
      ),
      2,
    )
  })
})
