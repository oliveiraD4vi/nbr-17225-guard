import type { AuditResult, Violation } from '@/types';

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

export function isViolationVisibleInMainLists(violation: Violation): boolean {
  return !(violation.requiresHumanReview && violation.humanReviewStatus === 'dismissed');
}

function getViolationComparisonKey(violation: Violation): string {
  return violation.id || [
    violation.ruleId,
    violation.elementSelector || '',
    violation.message,
    violation.suggestion,
  ].join('|');
}

export function getAuditNoteCount(result: AuditResult): number {
  return result.violations.filter((violation) => Boolean(violation.userNote?.trim())).length;
}

export function getConfirmedHumanReviewCount(result: AuditResult): number {
  return result.violations.filter((violation) => violation.humanReviewStatus === 'confirmed').length;
}

export function compareAuditResults(
  baseline: AuditResult,
  target: AuditResult
): AuditComparisonSummary {
  const baselineOpenViolations = baseline.violations.filter(isViolationVisibleInMainLists);
  const targetOpenViolations = target.violations.filter(isViolationVisibleInMainLists);

  const baselineKeys = new Set(baselineOpenViolations.map(getViolationComparisonKey));
  const targetKeys = new Set(targetOpenViolations.map(getViolationComparisonKey));

  return {
    baselineId: baseline.id || '',
    targetId: target.id || '',
    baselineTimestamp: baseline.timestamp,
    targetTimestamp: target.timestamp,
    newViolations: targetOpenViolations.filter((violation) => !baselineKeys.has(getViolationComparisonKey(violation))),
    resolvedViolations: baselineOpenViolations.filter((violation) => !targetKeys.has(getViolationComparisonKey(violation))),
    persistentViolations: targetOpenViolations.filter((violation) => baselineKeys.has(getViolationComparisonKey(violation))),
    baselineOpenCount: baselineOpenViolations.length,
    targetOpenCount: targetOpenViolations.length,
    baselineNoteCount: getAuditNoteCount(baseline),
    targetNoteCount: getAuditNoteCount(target),
    baselineConfirmedReviews: getConfirmedHumanReviewCount(baseline),
    targetConfirmedReviews: getConfirmedHumanReviewCount(target),
    openIssuesDeltaPercentage: getPercentageDelta(baselineOpenViolations.length, targetOpenViolations.length),
    notesDeltaPercentage: getPercentageDelta(getAuditNoteCount(baseline), getAuditNoteCount(target)),
    confirmedReviewsDeltaPercentage: getPercentageDelta(
      getConfirmedHumanReviewCount(baseline),
      getConfirmedHumanReviewCount(target)
    ),
  };
}
