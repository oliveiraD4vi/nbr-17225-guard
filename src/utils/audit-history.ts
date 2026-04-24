import type { AuditHistoryEntry, AuditResult, Violation } from '@/types';

export function getAuditUrlStorageKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getViolationIdentityKey(violation: Violation): string {
  return violation.id || [
    violation.ruleId,
    violation.elementSelector || '',
    violation.message,
    violation.suggestion,
  ].join('|');
}

export function dedupeAndSortAuditHistory(entries: AuditHistoryEntry[], maxEntries = 10): AuditHistoryEntry[] {
  return [...entries]
    .sort((left, right) => right.timestamp - left.timestamp)
    .filter((entry, index, currentEntries) =>
      currentEntries.findIndex((candidate) => candidate.id === entry.id) === index
    )
    .slice(0, maxEntries);
}

export function getVisibleAuditViolations(result: AuditResult): Violation[] {
  return result.violations.filter((violation) => (
    !(violation.requiresHumanReview && violation.humanReviewStatus === 'dismissed')
  ));
}
