import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { t } from '@/i18n'
import type { Violation } from '@/types'
import { ViolationsList, type ViolationsListState } from './ViolationsList'

function createViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    id: 'missing-label',
    ruleId: 'field-label',
    ruleName: 'Rótulo de campo',
    nbrReference: '5.9.1',
    description: 'Campos de formulário precisam de rótulo visível.',
    severity: 'error',
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
    message: 'Campo de e-mail sem rótulo visível.',
    snippet: '<input type="email" id="email">',
    suggestion: 'Adicione um rótulo visível ao campo.',
    remediationAdvice: 'Use um elemento label associado ao campo.',
    elementSelector: '#email',
    elementTagName: 'input',
    customId: 'missing-label',
    ...overrides,
  }
}

// The workspace owns the list state (open group and card); this stands in for it.
function ControlledViolationsList(props: ComponentProps<typeof ViolationsList>) {
  const [state, setState] = useState<ViolationsListState>()
  return <ViolationsList {...props} state={state} onStateChange={setState} />
}

// Violations are grouped by rule, and each card opens to show its actions.
async function openViolation(user: ReturnType<typeof userEvent.setup>, ruleName: string) {
  await user.click(screen.getByRole('tab', { name: new RegExp(ruleName) }))
  const card = document.querySelector<HTMLElement>(
    'button.violation-item-header[aria-expanded="false"]',
  )
  if (card) await user.click(card)
}

describe('ViolationsList', () => {
  it('asks for a reason before ignoring a violation', async () => {
    const user = userEvent.setup()
    const onFindingStatusChange = vi.fn()
    render(
      <ControlledViolationsList
        violations={[createViolation()]}
        onFindingStatusChange={onFindingStatusChange}
      />,
    )

    await openViolation(user, 'Rótulo de campo')
    await user.click(
      screen.getByRole('button', { name: new RegExp(t('violations.findingActionIgnore')) }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: t('violations.ignoreModalConfirm') }),
    )

    expect(within(dialog).getByText(t('violations.ignoreReasonRequired'))).toBeTruthy()
    expect(onFindingStatusChange).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('combobox'))
    await user.click(await screen.findByTitle(t('violations.ignoreReasons.falsePositive')))
    await user.click(
      within(dialog).getByRole('button', { name: t('violations.ignoreModalConfirm') }),
    )

    // The decision is applied after a short transition, so the card can show what is happening.
    await vi.waitFor(() =>
      expect(onFindingStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'missing-label' }),
        expect.objectContaining({ status: 'ignored', ignoreReason: 'false_positive' }),
      ),
    )
  })

  it('moves ignored violations out of the list and into their own drawer', async () => {
    const user = userEvent.setup()
    render(
      <ControlledViolationsList
        violations={[
          createViolation({
            id: 'ignored',
            findingStatus: 'ignored',
            ignoreReason: 'false_positive',
            humanReviewStatus: 'dismissed',
          }),
        ]}
      />,
    )

    expect(screen.queryByText('Rótulo de campo')).toBeNull()

    await user.click(
      screen.getByRole('button', { name: t('violations.openIgnored', { count: 1 }) }),
    )
    const drawer = await screen.findByRole('dialog')

    expect(within(drawer).getByText(t('violations.ignoredDrawerTitle'))).toBeTruthy()
    expect(within(drawer).getAllByText('Rótulo de campo').length).toBeGreaterThan(0)
  })

  it('gives every button an accessible name', () => {
    render(<ControlledViolationsList violations={[createViolation()]} />)

    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('aria-label') ?? button.textContent?.trim()).toBeTruthy()
    }
  })
})
