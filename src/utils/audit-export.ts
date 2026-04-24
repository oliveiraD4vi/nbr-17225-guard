import type { AuditResult } from '@/types';
import {
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison';
import { getRequirementScoreData } from '@/utils/audit-score';

export function buildExportableAuditResult(result: AuditResult) {
  const confirmedReviews = getConfirmedHumanReviewCount(result);
  const dismissedReviews = getDismissedHumanReviewCount(result);
  const pendingReviews = getPendingHumanReviewCount(result);
  const requirementScore = getRequirementScoreData(result);

  return {
    ...result,
    summary: {
      requirementScore,
      humanReview: {
        confirmed: confirmedReviews,
        dismissed: dismissedReviews,
        pending: pendingReviews,
        completed: confirmedReviews + dismissedReviews,
      },
    },
  };
}
