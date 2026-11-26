import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { t } from '@/i18n'
import type { AuditResult } from '@/types'
import { PopupLandingApp } from './PopupLandingApp'

const audit = { id: 'audit-1', url: 'https://example.com', pageTitle: 'Início' } as AuditResult

vi.mock('@/utils/audit-engine', () => ({
  getAuditTargetTab: async () => ({ id: 7, url: 'https://example.com', title: 'Início' }),
  getAuditResult: async () => audit,
}))

it("opens the report of the current tab's audit", async () => {
  const user = userEvent.setup()
  const sendMessage = vi.fn(async () => ({ status: 'OK' }))
  vi.stubGlobal('chrome', { runtime: { sendMessage, getURL: (path: string) => path } })
  render(<PopupLandingApp />)

  const openReport = await screen.findByRole('button', {
    name: new RegExp(t('shared.actions.openReport')),
  })
  await vi.waitFor(() => expect(openReport.hasAttribute('disabled')).toBe(false))
  await user.click(openReport)

  expect(sendMessage).toHaveBeenCalledWith({ action: 'OPEN_REPORT', auditResult: audit })
})
