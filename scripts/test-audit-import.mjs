import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

async function loadAuditEngineModule() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-import-'))
  const engineSourcePath = path.resolve('src/utils/audit-engine.ts')
  const historySourcePath = path.resolve('src/utils/audit-history.ts')
  const normativeSourcePath = path.resolve('src/normative.ts')

  const engineSource = (await fs.readFile(engineSourcePath, 'utf8'))
    .replace("from '@/i18n'", "from './i18n.mjs'")
    .replace("from '@/normative'", "from './normative.mjs'")
    .replace("from '@/utils/audit-history'", "from './audit-history.mjs'")
  const historySource = (await fs.readFile(historySourcePath, 'utf8')).replace(
    "from '@/normative'",
    "from './normative.mjs'",
  )
  const normativeSource = await fs.readFile(normativeSourcePath, 'utf8')
  const i18nSource = `
export function t(key) {
  const messages = {
    'engine.invalidImportReport': 'Relatório inválido para importação',
    'engine.quotaExceeded': 'Quota exceeded',
  }

  return messages[key] ?? key
}
`

  const transpileOptions = {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }

  const transpiledEngine = ts.transpileModule(engineSource, {
    ...transpileOptions,
    fileName: engineSourcePath,
  }).outputText
  const transpiledHistory = ts.transpileModule(historySource, {
    ...transpileOptions,
    fileName: historySourcePath,
  }).outputText
  const transpiledNormative = ts.transpileModule(normativeSource, {
    ...transpileOptions,
    fileName: normativeSourcePath,
  }).outputText

  const engineFile = path.join(tempDir, 'audit-engine.mjs')
  const historyFile = path.join(tempDir, 'audit-history.mjs')
  const normativeFile = path.join(tempDir, 'normative.mjs')
  const i18nFile = path.join(tempDir, 'i18n.mjs')

  await fs.writeFile(engineFile, transpiledEngine, 'utf8')
  await fs.writeFile(historyFile, transpiledHistory, 'utf8')
  await fs.writeFile(normativeFile, transpiledNormative, 'utf8')
  await fs.writeFile(i18nFile, i18nSource, 'utf8')

  try {
    return await import(pathToFileURL(engineFile).href)
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

const { parseImportedAuditReport } = await loadAuditEngineModule()

function createViolation(overrides = {}) {
  return {
    id: 'violation-id',
    ruleId: 'rule-id',
    ruleName: 'Regra',
    nbrReference: '5.1.1',
    description: 'Descrição',
    severity: 'error',
    wcagLevel: 'A',
    automationCategory: 'Semi-Automatizável',
    requiresHumanReview: false,
    message: 'Mensagem',
    snippet: '<button>Enviar</button>',
    suggestion: 'Sugestão',
    remediationAdvice: 'Correção',
    customId: 'custom-id',
    ...overrides,
  }
}

const wrappedPayload = {
  audit: {
    timestamp: '1717351200000',
    url: 'https://example.com/checkout#resumo',
    pageTitle: 'Checkout',
    includeRecommendations: true,
    totalViolations: 1,
    errors: 1,
    warnings: 0,
    humanReviewItems: 1,
    automatedFindings: 0,
    violations: [
      createViolation({
        id: 'human-review-item',
        requiresHumanReview: true,
      }),
    ],
    summary: {
      auditScore: {
        score: 76,
      },
    },
  },
}

const importedAudit = parseImportedAuditReport(wrappedPayload)

assert.equal(importedAudit.url, 'https://example.com/checkout#resumo')
assert.equal(importedAudit.timestamp, 1717351200000)
assert.equal(importedAudit.id, 'https://example.com/checkout|1717351200000')
assert.equal(importedAudit.includeRecommendations, true)
assert.equal(importedAudit.violations.length, 1)
assert.equal(importedAudit.violations[0].humanReviewStatus, 'pending')
assert.equal(importedAudit.violations[0].normativeType, 'Requisito')

const rawPayload = {
  timestamp: 1717351300000,
  url: 'https://example.com/relatorio',
  totalViolations: 1,
  errors: 0,
  warnings: 1,
  humanReviewItems: 0,
  automatedFindings: 1,
  violations: [
    createViolation({
      id: 'raw-entry',
      nbrReference: '7.3.2',
      severity: 'warning',
    }),
  ],
}

const importedRawAudit = parseImportedAuditReport(rawPayload)

assert.equal(importedRawAudit.id, 'https://example.com/relatorio|1717351300000')
assert.equal(importedRawAudit.violations[0].humanReviewStatus, 'not_applicable')
assert.equal(importedRawAudit.totalViolations, 1)

assert.throws(
  () =>
    parseImportedAuditReport({
      audit: {
        timestamp: 'abc',
        url: '',
        violations: [],
      },
    }),
  /Relatório inválido para importação/,
)

assert.throws(
  () =>
    parseImportedAuditReport({
      foo: 'bar',
    }),
  /Relatório inválido para importação/,
)

console.log('Audit import checks passed.')
