import { t } from '@/i18n'
import type { AuditResult } from '@/types'
import {
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison'
import { getAuditScoreData, getRequirementScoreData } from '@/utils/audit-score'

export function buildExportableAuditResult(result: AuditResult) {
  const confirmedReviews = getConfirmedHumanReviewCount(result)
  const dismissedReviews = getDismissedHumanReviewCount(result)
  const pendingReviews = getPendingHumanReviewCount(result)
  const auditScore = getAuditScoreData(result)
  const requirementScore = getRequirementScoreData(result)

  return {
    ...result,
    summary: {
      auditScore,
      requirementScore,
      humanReview: {
        confirmed: confirmedReviews,
        dismissed: dismissedReviews,
        pending: pendingReviews,
        completed: confirmedReviews + dismissedReviews,
      },
    },
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR')
}

export function buildAuditSummaryMarkdown(result: AuditResult): string {
  const auditScore = getAuditScoreData(result)
  const confirmedReviews = getConfirmedHumanReviewCount(result)
  const dismissedReviews = getDismissedHumanReviewCount(result)
  const pendingReviews = getPendingHumanReviewCount(result)
  const topViolations = [...result.violations]
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1
      if (a.requiresHumanReview !== b.requiresHumanReview) return a.requiresHumanReview ? -1 : 1
      return a.nbrReference.localeCompare(b.nbrReference, 'pt-BR')
    })
    .slice(0, 12)

  const lines = [
    `# ${t('summaryExport.title')}`,
    '',
    `- ${t('summaryExport.url')}: ${result.url}`,
    `- ${t('summaryExport.auditedAt')}: ${formatDate(result.timestamp)}`,
    `- ${t('summaryExport.scope')}: ${
      result.includeRecommendations
        ? t('summaryExport.scopeWithRecommendations')
        : t('summaryExport.scopeRequirementsOnly')
    }`,
    '',
    `## ${t('summaryExport.scoreTitle')}`,
    '',
    `- ${t('summaryExport.generalScore')}: ${auditScore.score}/100`,
    `- ${t('summaryExport.baseScore')}: ${auditScore.baseScore}/100`,
    `- ${t('summaryExport.volumeScoreCap')}: ${auditScore.volumeScoreCap}/100`,
    `- ${t('summaryExport.scoredViolationCount')}: ${auditScore.scoredViolationCount}`,
    `- ${t('summaryExport.requirementScore')}: ${auditScore.requirementScore}/100`,
    `- ${t('summaryExport.recommendationScore')}: ${
      auditScore.includesRecommendations
        ? `${auditScore.recommendationScore}/100`
        : t('summaryExport.notAudited')
    }`,
    `- ${t('summaryExport.humanReviewScore')}: ${auditScore.humanReviewScore}/100`,
    '',
    `## ${t('summaryExport.countsTitle')}`,
    '',
    `- ${t('shared.labels.total')}: ${result.totalViolations}`,
    `- ${t('shared.labels.requirements')}: ${result.errors}`,
    `- ${t('shared.labels.recommendations')}: ${result.warnings}`,
    `- ${t('shared.labels.humanReview')}: ${result.humanReviewItems}`,
    `- ${t('summaryExport.confirmed')}: ${confirmedReviews}`,
    `- ${t('summaryExport.dismissed')}: ${dismissedReviews}`,
    `- ${t('summaryExport.pending')}: ${pendingReviews}`,
    '',
    `## ${t('summaryExport.mainFindingsTitle')}`,
    '',
  ]

  if (topViolations.length === 0) {
    lines.push(t('summaryExport.noFindings'))
  } else {
    topViolations.forEach((violation) => {
      lines.push(
        `- ${violation.nbrReference} - ${violation.ruleName}: ${violation.message} (${violation.normativeType})`,
      )
    })
  }

  lines.push('', `_${t('summaryExport.footer')}_`)

  return lines.join('\n')
}
