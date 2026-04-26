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

export function getDisplayAuditResult(
  result: AuditResult,
  includeRecommendations: boolean
): AuditResult {
  const visibleViolations = getVisibleAuditViolations(result).filter((violation) => (
    includeRecommendations || violation.severity === 'error'
  ));

  const violationsByRule = visibleViolations.reduce<Record<string, Violation[]>>((acc, violation) => {
    acc[violation.ruleId] ??= [];
    acc[violation.ruleId].push(violation);
    return acc;
  }, {});

  const violationsBySeverity = visibleViolations.reduce<Record<'error' | 'warning', Violation[]>>(
    (acc, violation) => {
      acc[violation.severity].push(violation);
      return acc;
    },
    { error: [], warning: [] }
  );

  const pendingHumanReviewItems = visibleViolations.filter((violation) => (
    violation.requiresHumanReview && violation.humanReviewStatus === 'pending'
  )).length;

  return {
    ...result,
    totalViolations: visibleViolations.length,
    errors: violationsBySeverity.error.length,
    warnings: violationsBySeverity.warning.length,
    humanReviewItems: pendingHumanReviewItems,
    automatedFindings: visibleViolations.length - pendingHumanReviewItems,
    violations: visibleViolations,
    violationsByRule,
    violationsBySeverity,
  };
}

export function inheritViolationStateFromHistory(
  result: AuditResult,
  historyEntries: AuditHistoryEntry[]
): AuditResult {
  const persistedViolations = new Map<string, Violation>();

  historyEntries.forEach((entry) => {
    entry.violations.forEach((violation) => {
      const hasPersistedState = (
        violation.humanReviewStatus !== 'not_applicable' &&
        violation.humanReviewStatus !== 'pending'
      ) || Boolean(violation.userNote?.trim()) || Boolean(violation.userContrastOverride);

      if (!hasPersistedState) return;

      const key = getViolationIdentityKey(violation);
      if (!persistedViolations.has(key)) {
        persistedViolations.set(key, violation);
      }
    });
  });

  return {
    ...result,
    violations: result.violations.map((violation) => {
      const persistedViolation = persistedViolations.get(getViolationIdentityKey(violation));
      if (!persistedViolation) return violation;

      return {
        ...violation,
        humanReviewStatus: violation.requiresHumanReview
          ? persistedViolation.humanReviewStatus ?? violation.humanReviewStatus
          : violation.humanReviewStatus,
        userContrastOverride: persistedViolation.userContrastOverride ?? violation.userContrastOverride,
        userNote: persistedViolation.userNote ?? violation.userNote,
        noteUpdatedAt: persistedViolation.noteUpdatedAt ?? violation.noteUpdatedAt,
        inheritedFromHistory: true,
      };
    }),
  };
}
