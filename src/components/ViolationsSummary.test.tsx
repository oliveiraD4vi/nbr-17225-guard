import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { t } from '@/i18n'
import { CURRENT_AUDIT_SCHEMA_VERSION, type AuditResult } from '@/types'
import { ViolationsSummary } from './ViolationsSummary'

const audit: AuditResult = {
  schemaVersion: CURRENT_AUDIT_SCHEMA_VERSION,
  id: 'audit-1',
  timestamp: 1700000000000,
  url: 'https://example.com',
  pageTitle: 'Início',
  includeRecommendations: false,
  includeHumanReview: true,
  auditScope: 'page',
  scoreRange: { conservative: 100, confirmed: 100 },
  ruleExecution: { executed: 96, withCandidates: 0, awaitingManualReview: 0 },
  totalViolations: 0,
  errors: 0,
  warnings: 0,
  humanReviewItems: 0,
  automatedFindings: 0,
  violations: [],
  violationsByRule: {},
  violationsBySeverity: { error: [], warning: [] },
}

it('explains the score in a panel that opens on demand', async () => {
  render(<ViolationsSummary result={audit} />)

  const toggle = screen.getByRole('button', { name: new RegExp(t('summary.scorePanelTitle')) })
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText(t('summary.scorePanelDescription'))).toBeNull()

  await userEvent.click(toggle)

  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByText(t('summary.scorePanelDescription'))).toBeTruthy()
})
