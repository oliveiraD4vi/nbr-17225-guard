import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { t } from '@/i18n'
import { CURRENT_AUDIT_SCHEMA_VERSION, type AuditResult } from '@/types'
import { AuditWorkspaceApp } from './AuditWorkspaceApp'

vi.mock('antd', async (importOriginal) => ({
  ...(await importOriginal<typeof import('antd')>()),
  message: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() },
}))

const pageUrl = 'https://example.com/contato'
const tab = { id: 7, url: pageUrl, title: 'Contato' }

const audit: AuditResult = {
  schemaVersion: CURRENT_AUDIT_SCHEMA_VERSION,
  id: 'audit-1',
  timestamp: 1700000000000,
  url: pageUrl,
  pageTitle: 'Contato',
  includeRecommendations: false,
  includeHumanReview: true,
  auditScope: 'page',
  scoreRange: { conservative: 90, confirmed: 90 },
  ruleExecution: { executed: 96, withCandidates: 0, awaitingManualReview: 0 },
  totalViolations: 1,
  errors: 1,
  warnings: 0,
  humanReviewItems: 0,
  automatedFindings: 1,
  violations: [
    {
      id: 'missing-alt',
      customId: 'missing-alt',
      ruleId: 'image-alt-text',
      ruleName: 'Texto alternativo em imagens',
      nbrReference: '5.2.1',
      description: 'Imagens precisam de alternativa textual.',
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
      message: 'Imagem sem texto alternativo.',
      snippet: '<img src="logo.png">',
      suggestion: 'Adicione um atributo alt.',
      remediationAdvice: 'Descreva o conteúdo da imagem.',
      elementSelector: 'img',
    },
  ],
  violationsByRule: {},
  violationsBySeverity: { error: [], warning: [] },
}

const olderAudit: AuditResult = {
  ...audit,
  id: 'audit-0',
  timestamp: 1690000000000,
  totalViolations: 0,
  violations: [],
}

const sentToPage: Array<{ tabId: number; message: { action: string } }> = []

function installChrome() {
  const storage: Record<string, unknown> = {
    auditResultsByTab: { [tab.id]: audit },
    auditHistoryByUrl: { [pageUrl]: [audit, olderAudit] },
  }
  sentToPage.length = 0

  vi.stubGlobal('chrome', {
    runtime: {
      id: 'extension-id',
      getURL: (path: string) => `chrome-extension://extension-id/${path}`,
      sendMessage: vi.fn(async () => ({ status: 'OK' })),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    storage: {
      local: {
        QUOTA_BYTES: 10_485_760,
        get: async (keys: string | string[] | null) => {
          if (keys === null) return { ...storage }
          const list = Array.isArray(keys) ? keys : [keys]
          return Object.fromEntries(list.map((key) => [key, storage[key]]))
        },
        set: async (items: Record<string, unknown>) => {
          Object.assign(storage, items)
        },
        getBytesInUse: async () => 1024,
      },
    },
    tabs: {
      query: async () => [tab],
      get: async () => tab,
      connect: () => ({ onDisconnect: { addListener: vi.fn() }, disconnect: vi.fn() }),
      sendMessage: async (tabId: number, message: { action: string }) => {
        sentToPage.push({ tabId, message })
        return { status: 'OK' }
      },
    },
    scripting: { executeScript: async () => [] },
    permissions: { contains: async () => true, request: async () => true },
  })
}

describe('AuditWorkspaceApp', () => {
  beforeEach(installChrome)

  it('opens the stored audit of the inspected page with its actions in order', async () => {
    render(<AuditWorkspaceApp targetTab={tab} />)

    const actionNames = [
      t('shared.actions.highlightAll'),
      t('shared.actions.nextPriority'),
      t('shared.actions.exportCsv'),
      t('shared.actions.exportJson'),
      t('shared.actions.openReport'),
    ]
    const actions = await Promise.all(
      actionNames.map((name) => screen.findByRole('button', { name: new RegExp(name) })),
    )

    for (let index = 1; index < actions.length; index += 1) {
      expect(
        actions[index - 1].compareDocumentPosition(actions[index]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
    // The report is the one primary action of the bar.
    const primary = actions.filter((action) => action.classList.contains('ant-btn-primary'))
    expect(primary).toEqual([actions[4]])
  })

  it('sends the stored violations to the page to highlight them', async () => {
    const user = userEvent.setup()
    render(<AuditWorkspaceApp targetTab={tab} />)

    await user.click(
      await screen.findByRole('button', { name: new RegExp(t('shared.actions.highlightAll')) }),
    )

    const highlight = sentToPage.find((sent) => sent.message.action === 'HIGHLIGHT_ALL_VIOLATIONS')
    expect(highlight?.tabId).toBe(tab.id)
    expect(highlight?.message).toMatchObject({
      violations: [expect.objectContaining({ id: 'missing-alt' })],
    })
  })

  it('lists the violation in the violations tab', async () => {
    const user = userEvent.setup()
    render(<AuditWorkspaceApp targetTab={tab} />)

    await user.click(
      await screen.findByRole('tab', { name: t('popup.tabs.violations', { count: 1 }) }),
    )

    const panel = await screen.findByRole('tabpanel')
    expect(within(panel).getAllByText(/Texto alternativo em imagens/).length).toBeGreaterThan(0)
  })

  it('compares the latest audit with the previous one by default', async () => {
    const user = userEvent.setup()
    render(<AuditWorkspaceApp targetTab={tab} />)

    await user.click(
      await screen.findByRole('tab', { name: t('popup.tabs.history', { count: 2 }) }),
    )

    const selectedLabel = async (name: string) =>
      (await screen.findByRole('combobox', { name })).closest('.ant-select')?.textContent
    const optionLabel = (entry: AuditResult) =>
      t('popup.history.optionLabel', {
        date: new Date(entry.timestamp).toLocaleString('pt-BR'),
        count: entry.totalViolations,
      })

    expect(await selectedLabel(t('shared.labels.base'))).toBe(optionLabel(olderAudit))
    expect(await selectedLabel(t('shared.labels.compareWith'))).toBe(optionLabel(audit))
  })
})
