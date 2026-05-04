import { allRules } from '@/rules'
import { isNormativeRequirement } from '@/normative'
import type { AuditResult, Violation } from '@/types'

const requirementRuleIds = new Set(
  allRules.filter((rule) => isNormativeRequirement(rule.nbrReference)).map((rule) => rule.id),
)

function shouldCountRequirementViolation(violation: Violation): boolean {
  if (!isNormativeRequirement(violation.nbrReference)) return false
  if (!violation.requiresHumanReview) return true
  return violation.humanReviewStatus === 'confirmed'
}

export interface RequirementScoreData {
  score: number
  totalRequirementRules: number
  violatedRequirementRules: number
  pendingHumanRequirementRules: number
}

export function getRequirementScoreData(result: AuditResult): RequirementScoreData {
  const violatedRequirementRules = new Set(
    result.violations
      .filter(shouldCountRequirementViolation)
      .map((violation) => violation.ruleId)
      .filter((ruleId) => requirementRuleIds.has(ruleId)),
  )

  const pendingHumanRequirementRules = new Set(
    result.violations
      .filter(
        (violation) =>
          isNormativeRequirement(violation.nbrReference) &&
          violation.requiresHumanReview &&
          violation.humanReviewStatus === 'pending',
      )
      .map((violation) => violation.ruleId)
      .filter((ruleId) => requirementRuleIds.has(ruleId)),
  )

  const totalRequirementRules = requirementRuleIds.size
  const score = Math.max(
    0,
    Math.round(
      ((totalRequirementRules - violatedRequirementRules.size) / totalRequirementRules) * 100,
    ),
  )

  return {
    score,
    totalRequirementRules,
    violatedRequirementRules: violatedRequirementRules.size,
    pendingHumanRequirementRules: pendingHumanRequirementRules.size,
  }
}
