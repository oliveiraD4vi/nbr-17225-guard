import { describe, expect, it } from 'vitest'
import { CURRENT_AUDIT_SCHEMA_VERSION } from '@/types'
import { parseAuditScope, readAuditReport } from '@/utils/audit-report-parser'

const violation = {
  id: 'v1',
  ruleId: 'field-label',
  ruleName: 'Rótulo de campo',
  nbrReference: '5.9.1',
  description: 'Campos precisam de rótulo.',
  severity: 'error',
  wcagLevel: 'A',
  automationCategory: 'Totalmente Automatizável',
  message: 'Campo sem rótulo.',
  snippet: '<input>',
  suggestion: 'Adicione um rótulo.',
  remediationAdvice: 'Use label.',
}

function report(overrides: Record<string, unknown> = {}) {
  return {
    audit: {
      schemaVersion: CURRENT_AUDIT_SCHEMA_VERSION,
      timestamp: 1700000000000,
      url: 'https://example.com',
      violations: [violation],
      ...overrides,
    },
  }
}

describe('readAuditReport', () => {
  it('reads an exported report', () => {
    const audit = readAuditReport(report())

    expect(audit.url).toBe('https://example.com')
    expect(audit.violations).toEqual([expect.objectContaining({ id: 'v1', severity: 'error' })])
  })

  it.each([
    ['an unknown severity', { severity: 'critical' }, '$.audit.violations[0].severity'],
    [
      'an unknown finding status',
      { findingStatus: 'resolved' },
      '$.audit.violations[0].findingStatus',
    ],
    [
      'a rule name that is not text',
      { ruleName: { html: '<b>' } },
      '$.audit.violations[0].ruleName',
    ],
    [
      'malformed evidence',
      { evidence: [{ kind: 'dom' }] },
      '$.audit.violations[0].evidence[0].summary',
    ],
  ])('rejects a violation with %s and names the field', (_, override, path) => {
    expect(() => readAuditReport(report({ violations: [{ ...violation, ...override }] }))).toThrow(
      path,
    )
  })

  it('rejects a report whose page address is not a URL', () => {
    expect(() => readAuditReport(report({ url: 'página de checkout' }))).toThrow('$.audit.url')
  })

  it('rejects reports written by a newer version of the extension', () => {
    expect(() =>
      readAuditReport(report({ schemaVersion: CURRENT_AUDIT_SCHEMA_VERSION + 1 })),
    ).toThrow('$.audit.schemaVersion')
  })

  it('rejects a malformed site session', () => {
    expect(() =>
      readAuditReport(
        report({
          siteSession: {
            id: 's1',
            origin: 'https://example.com',
            startedAt: 1,
            updatedAt: 2,
            pages: [{ url: 'https://example.com', auditedAt: 'ontem' }],
            reviewCandidates: [],
          },
        }),
      ),
    ).toThrow('$.audit.siteSession.pages[0].auditedAt')
  })

  it('keeps only the fields of the audit schema', () => {
    const audit = readAuditReport(
      report({
        injected: true,
        violations: [{ ...violation, element: { nodeName: 'INPUT' }, inheritedFromHistory: true }],
      }),
    )

    expect(audit).not.toHaveProperty('injected')
    expect(audit.violations[0]).not.toHaveProperty('element')
    expect(audit.violations[0]).not.toHaveProperty('inheritedFromHistory')
  })

  it('accepts reports exported before the timestamp became a number', () => {
    expect(readAuditReport(report({ timestamp: '1700000000000' })).timestamp).toBe(1700000000000)
  })
})

describe('parseAuditScope', () => {
  it('accepts only the known scopes', () => {
    expect(parseAuditScope('journey')).toBe('journey')
    expect(parseAuditScope('everything')).toBeUndefined()
    expect(parseAuditScope(undefined)).toBeUndefined()
  })
})
