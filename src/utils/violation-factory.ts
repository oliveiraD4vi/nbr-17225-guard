import { getNormativeRuleType } from '@/normative'
import type {
  FindingConfidence,
  FindingEvidence,
  ManualFindingDraft,
  Rule,
  SeverityLevel,
  VerificationMode,
  Violation,
  WCAGLevel,
} from '@/types'
import { getAccessibleName, getLabelledByText } from '@/utils/accessible-name'
import {
  getDefaultReviewQuestion,
  getFindingConfidence,
  getRuleAuditScope,
  getRuleVerificationMode,
} from '@/utils/audit-contract'
import { getElementSelector } from '@/utils/element-identity'
import { getVisibleText } from '@/utils/visibility'

const alternativeTextRuleIds = new Set([
  'image-alt-text',
  'image-functional-alt',
  'image-decorative',
  'complex-image-description',
  'image-of-text',
  'image-map-alt-text',
])

function hashString(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

// Stable across audits: the same rule, element and text always produce the same id, which is how
// triage decisions follow a finding from one audit to the next.
function generateCustomId(prefix: string, seed: string): string {
  return `${prefix}-${hashString(seed)}`
}

function isAlternativeTextRule(ruleId: string, nbrReference: string): boolean {
  return alternativeTextRuleIds.has(ruleId) || nbrReference.startsWith('5.2.')
}

function getAlternativeTextTargetAttribute(
  element: Element,
  currentSource: NonNullable<Violation['alternativeTextReview']>['currentSource'],
): NonNullable<Violation['alternativeTextReview']>['targetAttribute'] {
  if (
    currentSource === 'aria-label' ||
    currentSource === 'aria-labelledby' ||
    currentSource === 'title'
  ) {
    return currentSource
  }

  if (element.matches('img, area')) {
    return 'alt'
  }

  return 'aria-label'
}

function getAlternativeTextReviewForElement(
  element: HTMLElement,
  ruleId: string,
  nbrReference: string,
): Violation['alternativeTextReview'] {
  if (!isAlternativeTextRule(ruleId, nbrReference) || !element.matches('img, area')) {
    return undefined
  }

  let currentSource: NonNullable<Violation['alternativeTextReview']>['currentSource'] = 'missing'
  let currentText = ''

  const ariaLabel = element.getAttribute('aria-label')
  const labelledBy = element.getAttribute('aria-labelledby')
  const alt = element.getAttribute('alt')
  const title = element.getAttribute('title')

  if (ariaLabel?.trim()) {
    currentSource = 'aria-label'
    currentText = ariaLabel.trim()
  } else if (labelledBy) {
    currentSource = 'aria-labelledby'
    currentText = getLabelledByText(element)
  } else if (alt !== null) {
    currentSource = 'alt'
    currentText = alt.trim()
  } else if (title?.trim()) {
    currentSource = 'title'
    currentText = title.trim()
  } else {
    const parentControl = element.closest<HTMLElement>('a, button')
    const parentName = parentControl ? getAccessibleName(parentControl).trim() : ''
    if (parentName) {
      currentSource = 'accessible_name'
      currentText = parentName
    }
  }

  return {
    currentSource,
    currentText,
    targetAttribute: getAlternativeTextTargetAttribute(element, currentSource),
  }
}

function getAlternativeTextReviewForManualDraft(
  rule: Pick<Rule, 'id' | 'nbrReference'>,
  draft: ManualFindingDraft,
): Violation['alternativeTextReview'] {
  const tagName = draft.tagName?.toLowerCase()
  if (
    !isAlternativeTextRule(rule.id, rule.nbrReference) ||
    !['img', 'area'].includes(tagName || '')
  ) {
    return undefined
  }

  return {
    currentSource: draft.accessibleName ? 'accessible_name' : 'missing',
    currentText: draft.accessibleName || '',
    targetAttribute: 'alt',
  }
}

export function createViolation(
  rule: Pick<
    Rule,
    | 'id'
    | 'name'
    | 'nbrReference'
    | 'severity'
    | 'wcagLevel'
    | 'description'
    | 'category'
    | 'verificationMode'
    | 'auditScope'
  >,
  options: {
    element?: HTMLElement
    message: string
    suggestion: string
    remediationAdvice: string
    snippet?: string
    description?: string
    severity?: SeverityLevel
    wcagLevel?: WCAGLevel
    customIdPrefix?: string
    contrastDetails?: Violation['contrastDetails']
    requiresHumanReview?: boolean
    verificationMode?: VerificationMode
    confidence?: FindingConfidence
    evidence?: FindingEvidence[]
    reviewQuestion?: string
  },
): Violation {
  const element = options.element
  const selector = element ? getElementSelector(element) : undefined
  const ruleVerificationMode = getRuleVerificationMode(rule)
  const requiresHumanReview = options.requiresHumanReview ?? ruleVerificationMode !== 'automatic'
  const verificationMode =
    options.verificationMode ??
    (requiresHumanReview && ruleVerificationMode === 'automatic'
      ? 'assisted'
      : ruleVerificationMode)
  const stableSeed = [
    rule.id,
    selector || '',
    options.message,
    options.suggestion,
    options.description || rule.description,
  ].join('|')

  return {
    id: generateCustomId(rule.id, stableSeed),
    ruleId: rule.id,
    ruleName: rule.name,
    nbrReference: rule.nbrReference,
    description: options.description || rule.description,
    severity: options.severity || rule.severity,
    wcagLevel: options.wcagLevel || rule.wcagLevel,
    automationCategory: rule.category,
    verificationMode,
    auditScope: getRuleAuditScope(rule),
    confidence: options.confidence ?? getFindingConfidence(verificationMode),
    evidence: options.evidence ?? [
      {
        kind: verificationMode === 'automatic' ? 'dom' : 'author_review',
        summary: options.message,
        selector,
      },
    ],
    reviewQuestion: options.reviewQuestion ?? getDefaultReviewQuestion(verificationMode),
    normativeType: getNormativeRuleType(rule.nbrReference),
    requiresHumanReview,
    humanReviewStatus: requiresHumanReview ? 'pending' : 'not_applicable',
    findingOrigin: 'automatic',
    findingStatus: 'open',
    message: options.message,
    snippet: options.snippet || element?.outerHTML.substring(0, 200) || '<document>',
    suggestion: options.suggestion,
    remediationAdvice: options.remediationAdvice,
    elementSelector: selector,
    elementTagName: element ? element.tagName.toLowerCase() : undefined,
    elementAccessibleName: element ? getAccessibleName(element) || undefined : undefined,
    elementVisibleText: element ? getVisibleText(element) || undefined : undefined,
    contrastDetails: options.contrastDetails,
    alternativeTextReview: element
      ? getAlternativeTextReviewForElement(element, rule.id, rule.nbrReference)
      : undefined,
    customId: generateCustomId(options.customIdPrefix || rule.id, stableSeed),
  }
}

export function createManualViolation(
  rule: Pick<
    Rule,
    | 'id'
    | 'name'
    | 'nbrReference'
    | 'severity'
    | 'wcagLevel'
    | 'description'
    | 'category'
    | 'auditScope'
  >,
  options: {
    draft: ManualFindingDraft
    message: string
    suggestion: string
    remediationAdvice: string
    severity?: SeverityLevel
    userNote?: string
    createdAt?: number
  },
): Violation {
  const createdAt = options.createdAt ?? Date.now()
  const message = options.message.trim()
  const suggestion = options.suggestion.trim()
  const remediationAdvice = options.remediationAdvice.trim()
  const userNote = options.userNote?.trim() || undefined
  const stableSeed = [
    'manual',
    rule.id,
    options.draft.selector,
    message,
    options.draft.selectedAt,
  ].join('|')

  return {
    id: generateCustomId(`manual-${rule.id}`, stableSeed),
    ruleId: rule.id,
    ruleName: rule.name,
    nbrReference: rule.nbrReference,
    description: rule.description,
    severity: options.severity || rule.severity,
    wcagLevel: rule.wcagLevel,
    automationCategory: rule.category,
    verificationMode: 'manual',
    auditScope: getRuleAuditScope(rule),
    confidence: 'contextual',
    evidence: [
      {
        kind: 'author_review',
        summary: message,
        selector: options.draft.selector,
      },
    ],
    reviewQuestion: getDefaultReviewQuestion('manual'),
    normativeType: getNormativeRuleType(rule.nbrReference),
    requiresHumanReview: true,
    humanReviewStatus: 'confirmed',
    findingOrigin: 'manual',
    findingStatus: 'confirmed',
    findingStatusUpdatedAt: createdAt,
    message,
    snippet: options.draft.snippet,
    suggestion,
    remediationAdvice,
    elementSelector: options.draft.selector,
    elementTagName: options.draft.tagName,
    elementAccessibleName: options.draft.accessibleName,
    elementVisibleText: options.draft.visibleText,
    alternativeTextReview: getAlternativeTextReviewForManualDraft(rule, options.draft),
    userNote,
    noteUpdatedAt: userNote ? createdAt : undefined,
    customId: generateCustomId(`manual-${rule.id}`, stableSeed),
  }
}
