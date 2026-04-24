import type { AuditResult, Violation } from '@/types';
import { getViolationIdentityKey, getVisibleAuditViolations } from '@/utils/audit-history';

export interface AuditComparisonSummary {
  baselineId: string;
  targetId: string;
  baselineTimestamp: number;
  targetTimestamp: number;
  newViolations: Violation[];
  resolvedViolations: Violation[];
  persistentViolations: Violation[];
  baselineOpenCount: number;
  targetOpenCount: number;
  baselineNoteCount: number;
  targetNoteCount: number;
  baselineConfirmedReviews: number;
  targetConfirmedReviews: number;
  baselineDismissedReviews: number;
  targetDismissedReviews: number;
  baselinePendingReviews: number;
  targetPendingReviews: number;
  openIssuesDeltaPercentage: number;
  notesDeltaPercentage: number;
  confirmedReviewsDeltaPercentage: number;
}

export function getPercentageDelta(baselineValue: number, targetValue: number): number {
  if (baselineValue === 0) {
    return targetValue === 0 ? 0 : 100;
  }

  return Number((((targetValue - baselineValue) / baselineValue) * 100).toFixed(1));
}

export function getAuditNoteCount(result: AuditResult): number {
  return result.violations.filter((violation) => Boolean(violation.userNote?.trim())).length;
}

export function getConfirmedHumanReviewCount(result: AuditResult): number {
  return result.violations.filter((violation) => violation.humanReviewStatus === 'confirmed').length;
}

export function getDismissedHumanReviewCount(result: AuditResult): number {
  return result.violations.filter((violation) => violation.humanReviewStatus === 'dismissed').length;
}

export function getPendingHumanReviewCount(result: AuditResult): number {
  return result.violations.filter((violation) => (
    violation.requiresHumanReview &&
    violation.humanReviewStatus === 'pending'
  )).length;
}

export function compareAuditResults(
  baseline: AuditResult,
  target: AuditResult
): AuditComparisonSummary {
  const baselineOpenViolations = getVisibleAuditViolations(baseline);
  const targetOpenViolations = getVisibleAuditViolations(target);

  const baselineKeys = new Set(baselineOpenViolations.map(getViolationIdentityKey));
  const targetKeys = new Set(targetOpenViolations.map(getViolationIdentityKey));

  return {
    baselineId: baseline.id || '',
    targetId: target.id || '',
    baselineTimestamp: baseline.timestamp,
    targetTimestamp: target.timestamp,
    newViolations: targetOpenViolations.filter((violation) => !baselineKeys.has(getViolationIdentityKey(violation))),
    resolvedViolations: baselineOpenViolations.filter((violation) => !targetKeys.has(getViolationIdentityKey(violation))),
    persistentViolations: targetOpenViolations.filter((violation) => baselineKeys.has(getViolationIdentityKey(violation))),
    baselineOpenCount: baselineOpenViolations.length,
    targetOpenCount: targetOpenViolations.length,
    baselineNoteCount: getAuditNoteCount(baseline),
    targetNoteCount: getAuditNoteCount(target),
    baselineConfirmedReviews: getConfirmedHumanReviewCount(baseline),
    targetConfirmedReviews: getConfirmedHumanReviewCount(target),
    baselineDismissedReviews: getDismissedHumanReviewCount(baseline),
    targetDismissedReviews: getDismissedHumanReviewCount(target),
    baselinePendingReviews: getPendingHumanReviewCount(baseline),
    targetPendingReviews: getPendingHumanReviewCount(target),
    openIssuesDeltaPercentage: getPercentageDelta(baselineOpenViolations.length, targetOpenViolations.length),
    notesDeltaPercentage: getPercentageDelta(getAuditNoteCount(baseline), getAuditNoteCount(target)),
    confirmedReviewsDeltaPercentage: getPercentageDelta(
      getConfirmedHumanReviewCount(baseline),
      getConfirmedHumanReviewCount(target)
    ),
  };
}
