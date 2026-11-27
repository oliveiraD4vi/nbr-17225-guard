import { getRunnableRules } from '@/rules'
import { CURRENT_AUDIT_SCHEMA_VERSION, type AuditResult, type Violation } from '@/types'
import { getRuleVerificationMode } from '@/utils/audit-contract'
import { clearHighlights } from './violation-highlights'
import { clearContrastPreviews } from './contrast-preview-session'

export async function runAuditInPage(
  includeRecommendations: boolean,
  includeHumanReview: boolean,
  auditScope: AuditResult['auditScope'],
): Promise<AuditResult> {
  await ensureDocumentReady()
  clearContrastPreviews()
  clearHighlights()
  await waitForAuditStability()

  const violations: Violation[] = []
  const rulesToRun = getRunnableRules(includeRecommendations, includeHumanReview, auditScope)

  for (const rule of rulesToRun) {
    try {
      const ruleViolations = await rule.check()
      violations.push(...ruleViolations)
    } catch (error) {
      console.error(`[Guardião NBR 17225] Erro na regra ${rule.id}:`, error)
    }
  }

  const dedupedViolations = dedupeViolations(violations).filter(
    (violation) => includeHumanReview || !violation.requiresHumanReview,
  )

  const violationsByRule = dedupedViolations.reduce<Record<string, Violation[]>>(
    (acc, violation) => {
      acc[violation.ruleId] ??= []
      acc[violation.ruleId].push(violation)
      return acc
    },
    {},
  )

  const violationsBySeverity = dedupedViolations.reduce<Record<'error' | 'warning', Violation[]>>(
    (acc, violation) => {
      acc[violation.severity].push(violation)
      return acc
    },
    { error: [], warning: [] },
  )
  const requirementViolations = dedupedViolations.filter(
    (violation) => violation.normativeType === 'Requisito',
  )
  const recommendationViolations = dedupedViolations.filter(
    (violation) => violation.normativeType === 'Recomendação',
  )
  const humanReviewItems = dedupedViolations.filter(
    (violation) => violation.requiresHumanReview,
  ).length
  const automatedFindings = dedupedViolations.length - humanReviewItems

  return {
    schemaVersion: CURRENT_AUDIT_SCHEMA_VERSION,
    violations: dedupedViolations,
    totalViolations: dedupedViolations.length,
    errors: requirementViolations.length,
    warnings: recommendationViolations.length,
    humanReviewItems,
    automatedFindings,
    timestamp: Date.now(),
    url: window.location.href,
    pageTitle: document.title,
    includeRecommendations,
    includeHumanReview,
    auditScope,
    scoreRange: { conservative: 100, confirmed: 100 },
    ruleExecution: {
      executed: rulesToRun.length,
      withCandidates: new Set(
        dedupedViolations
          .filter((violation) => violation.requiresHumanReview)
          .map((violation) => violation.ruleId),
      ).size,
      awaitingManualReview: rulesToRun.filter((rule) => getRuleVerificationMode(rule) === 'manual')
        .length,
    },
    violationsByRule,
    violationsBySeverity,
  }
}

function dedupeViolations(violations: Violation[]): Violation[] {
  const seen = new Set<string>()

  return violations.filter((violation) => {
    const signature = [
      violation.ruleId,
      violation.elementSelector || '',
      violation.message,
      violation.suggestion,
    ].join('|')

    if (seen.has(signature)) {
      return false
    }

    seen.add(signature)
    return true
  })
}

function ensureDocumentReady(): Promise<void> {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
  })
}

async function waitForAuditStability(): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

  await new Promise<void>((resolve) => {
    let settled = false
    let settleTimer = window.setTimeout(finish, 300)
    const timeoutId = window.setTimeout(finish, 1500)
    const observer = new MutationObserver(() => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(finish, 300)
    })

    function finish() {
      if (settled) return
      settled = true
      observer.disconnect()
      window.clearTimeout(settleTimer)
      window.clearTimeout(timeoutId)
      resolve()
    }

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })
  })
}
