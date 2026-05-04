export type NormativeRuleType = 'Requisito' | 'Recomendação'

export const NORMATIVE_RULE_TYPES = {
  requirement: 'Requisito',
  recommendation: 'Recomendação',
} as const

const recommendationReferences = new Set([
  '5.1.2',
  '5.1.5',
  '5.1.7',
  '5.1.10',
  '5.1.12',
  '5.1.14',
  '5.1.15',
  '5.3.3',
  '5.3.4',
  '5.4.3',
  '5.4.4',
  '5.6.4',
  '5.6.6',
  '5.7.3',
  '5.7.5',
  '5.7.6',
  '5.7.7',
  '5.7.8',
  '5.7.9',
  '5.7.10',
  '5.7.11',
  '5.7.14',
  '5.8.4',
  '5.8.6',
  '5.8.8',
  '5.8.15',
  '5.9.11',
  '5.9.13',
  '5.9.14',
  '5.9.17',
  '5.10.5',
  '5.11.2',
  '5.12.5',
  '5.12.10',
  '5.12.11',
  '5.12.12',
  '5.12.13',
  '5.13.9',
  '5.13.11',
  '5.14.3',
  '5.14.5',
  '5.14.6',
  '5.14.8',
  '5.14.10',
  '5.15.2',
  '5.15.3',
  '5.16.1',
  '5.16.4',
  '5.16.5',
  '5.16.6',
])

export function getNormativeRuleType(reference: string): NormativeRuleType {
  return recommendationReferences.has(reference)
    ? NORMATIVE_RULE_TYPES.recommendation
    : NORMATIVE_RULE_TYPES.requirement
}

export function isNormativeRecommendation(reference: string): boolean {
  return getNormativeRuleType(reference) === NORMATIVE_RULE_TYPES.recommendation
}

export function isNormativeRequirement(reference: string): boolean {
  return getNormativeRuleType(reference) === NORMATIVE_RULE_TYPES.requirement
}
