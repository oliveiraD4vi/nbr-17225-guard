import { allRules } from '@/rules'
import { isNormativeRecommendation, isNormativeRequirement } from '@/normative'
import type { AuditResult, Violation } from '@/types'

const requirementRuleIds = new Set(
  allRules.filter((rule) => isNormativeRequirement(rule.nbrReference)).map((rule) => rule.id),
)

const recommendationRuleIds = new Set(
  allRules.filter((rule) => isNormativeRecommendation(rule.nbrReference)).map((rule) => rule.id),
)

function shouldCountViolation(violation: Violation): boolean {
  if (!violation.requiresHumanReview) return true
  return violation.humanReviewStatus === 'confirmed'
}

function getViolatedRuleCount(
  result: AuditResult,
  ruleIds: Set<string>,
  predicate: (reference: string) => boolean,
): number {
  return new Set(
    result.violations
      .filter((violation) => predicate(violation.nbrReference) && shouldCountViolation(violation))
      .map((violation) => violation.ruleId)
      .filter((ruleId) => ruleIds.has(ruleId)),
  ).size
}

function getPendingHumanRuleCount(
  result: AuditResult,
  ruleIds: Set<string>,
  predicate: (reference: string) => boolean,
): number {
  return new Set(
    result.violations
      .filter(
        (violation) =>
          predicate(violation.nbrReference) &&
          violation.requiresHumanReview &&
          violation.humanReviewStatus === 'pending',
      )
      .map((violation) => violation.ruleId)
      .filter((ruleId) => ruleIds.has(ruleId)),
  ).size
}

function getRuleScore(totalRules: number, violatedRules: number): number {
  if (totalRules === 0) return 100
  return Math.max(0, Math.round(((totalRules - violatedRules) / totalRules) * 100))
}

export interface AuditScoreWeights {
  requirements: number
  recommendations: number
  humanReview: number
}

export interface AuditScoreData {
  score: number
  requirementScore: number
  recommendationScore: number
  humanReviewScore: number
  totalRequirementRules: number
  totalRecommendationRules: number
  violatedRequirementRules: number
  violatedRecommendationRules: number
  pendingHumanRequirementRules: number
  pendingHumanRecommendationRules: number
  pendingHumanReviewItems: number
  completedHumanReviewItems: number
  totalHumanReviewItems: number
  includesRecommendations: boolean
  weights: AuditScoreWeights
}

export type RequirementScoreData = Pick<
  AuditScoreData,
  'score' | 'totalRequirementRules' | 'violatedRequirementRules' | 'pendingHumanRequirementRules'
>

export function getAuditScoreData(result: AuditResult): AuditScoreData {
  const includesRecommendations =
    result.includeRecommendations ??
    result.violations.some((violation) => isNormativeRecommendation(violation.nbrReference))
  const totalRequirementRules = requirementRuleIds.size
  const totalRecommendationRules = includesRecommendations ? recommendationRuleIds.size : 0
  const violatedRequirementRules = getViolatedRuleCount(
    result,
    requirementRuleIds,
    isNormativeRequirement,
  )
  const violatedRecommendationRules = includesRecommendations
    ? getViolatedRuleCount(result, recommendationRuleIds, isNormativeRecommendation)
    : 0
  const pendingHumanRequirementRules = getPendingHumanRuleCount(
    result,
    requirementRuleIds,
    isNormativeRequirement,
  )
  const pendingHumanRecommendationRules = includesRecommendations
    ? getPendingHumanRuleCount(result, recommendationRuleIds, isNormativeRecommendation)
    : 0
  const humanReviewViolations = result.violations.filter(
    (violation) => violation.requiresHumanReview,
  )
  const pendingHumanReviewItems = humanReviewViolations.filter(
    (violation) => violation.humanReviewStatus === 'pending',
  ).length
  const completedHumanReviewItems = humanReviewViolations.filter(
    (violation) =>
      violation.humanReviewStatus === 'confirmed' || violation.humanReviewStatus === 'dismissed',
  ).length
  const totalHumanReviewItems = humanReviewViolations.length
  const requirementScore = getRuleScore(totalRequirementRules, violatedRequirementRules)
  const recommendationScore = getRuleScore(totalRecommendationRules, violatedRecommendationRules)
  const humanReviewScore =
    totalHumanReviewItems === 0
      ? 100
      : Math.round((completedHumanReviewItems / totalHumanReviewItems) * 100)
  const weights: AuditScoreWeights = includesRecommendations
    ? { requirements: 0.7, recommendations: 0.2, humanReview: 0.1 }
    : { requirements: 0.9, recommendations: 0, humanReview: 0.1 }
  const score = Math.max(
    0,
    Math.round(
      requirementScore * weights.requirements +
        recommendationScore * weights.recommendations +
        humanReviewScore * weights.humanReview,
    ),
  )

  return {
    score,
    requirementScore,
    recommendationScore,
    humanReviewScore,
    totalRequirementRules,
    totalRecommendationRules,
    violatedRequirementRules,
    violatedRecommendationRules,
    pendingHumanRequirementRules,
    pendingHumanRecommendationRules,
    pendingHumanReviewItems,
    completedHumanReviewItems,
    totalHumanReviewItems,
    includesRecommendations,
    weights,
  }
}

export function getRequirementScoreData(result: AuditResult): RequirementScoreData {
  const auditScore = getAuditScoreData(result)

  return {
    score: auditScore.requirementScore,
    totalRequirementRules: auditScore.totalRequirementRules,
    violatedRequirementRules: auditScore.violatedRequirementRules,
    pendingHumanRequirementRules: auditScore.pendingHumanRequirementRules,
  }
}
