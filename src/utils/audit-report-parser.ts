import { NORMATIVE_RULE_TYPES } from '@/normative'
import {
  AUTOMATION_CATEGORIES,
  CURRENT_AUDIT_SCHEMA_VERSION,
  type AuditResult,
  type AuditScope,
  type FindingEvidence,
  type JourneyAuditSession,
  type PageAuditContext,
  type SessionReviewCandidate,
  type SiteAuditSession,
  type Violation,
} from '@/types'

/**
 * Reads audit data that crosses a trust boundary (an imported JSON report) into precise types.
 * Anything that does not match the audit schema is rejected and fields the schema does not know are
 * dropped. Fields that older exports lack stay absent here: normalization derives them
 * (normalizeViolationFindingState and hydrateAuditResult), as it does for older stored audits.
 */

export class InvalidAuditReportError extends Error {
  constructor(path: string) {
    super(`Relatório de auditoria inválido em "${path}".`)
    this.name = 'InvalidAuditReportError'
  }
}

type UnknownRecord = Record<string, unknown>

const AUDIT_SCOPES = ['page', 'site', 'journey'] as const
const SEVERITIES = ['error', 'warning'] as const
const WCAG_LEVELS = ['A', 'AA', 'AAA'] as const
const AUTOMATION_CATEGORY_VALUES = Object.values(AUTOMATION_CATEGORIES)
const NORMATIVE_TYPE_VALUES = Object.values(NORMATIVE_RULE_TYPES)
const VERIFICATION_MODES = ['automatic', 'assisted', 'manual'] as const
const CONFIDENCES = ['high', 'medium', 'contextual'] as const
const EVIDENCE_KINDS = ['dom', 'computed_style', 'interaction', 'author_review', 'session'] as const
const HUMAN_REVIEW_STATUSES = ['not_applicable', 'pending', 'confirmed', 'dismissed'] as const
const FINDING_ORIGINS = ['automatic', 'manual'] as const
const FINDING_STATUSES = ['open', 'confirmed', 'ignored'] as const
const IGNORE_REASONS = [
  'false_positive',
  'out_of_scope',
  'accepted_risk',
  'duplicate',
  'other',
] as const
const CONTRAST_CONTEXTS = ['text', 'component', 'graphic', 'focus'] as const
const ALTERNATIVE_TEXT_SOURCES = [
  'alt',
  'aria-label',
  'aria-labelledby',
  'title',
  'accessible_name',
  'missing',
] as const
const ALTERNATIVE_TEXT_TARGETS = ['alt', 'aria-label', 'aria-labelledby', 'title'] as const

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

export function parseAuditScope(value: unknown): AuditScope | undefined {
  return isOneOf(AUDIT_SCOPES, value) ? value : undefined
}

/** Field readers bound to the path of the object they read, so errors point at the bad field. */
function fieldsOf(record: UnknownRecord, path: string) {
  const fail = (key: string): never => {
    throw new InvalidAuditReportError(`${path}.${key}`)
  }
  const optional = <T>(key: string, accept: (value: unknown) => value is T): T | undefined => {
    const value = record[key]
    if (value === undefined || value === null) return undefined
    return accept(value) ? value : fail(key)
  }
  const required = <T>(key: string, accept: (value: unknown) => value is T): T =>
    optional(key, accept) ?? fail(key)

  return {
    fail,
    string: (key: string) => required(key, isString),
    optionalString: (key: string) => optional(key, isString),
    number: (key: string) => required(key, isFiniteNumber),
    optionalNumber: (key: string) => optional(key, isFiniteNumber),
    optionalBoolean: (key: string) => optional(key, isBoolean),
    oneOf: <T extends string>(key: string, allowed: readonly T[]) =>
      required(key, (value): value is T => isOneOf(allowed, value)),
    optionalOneOf: <T extends string>(key: string, allowed: readonly T[]) =>
      optional(key, (value): value is T => isOneOf(allowed, value)),
    record: (key: string) => required(key, isRecord),
    optionalRecord: (key: string) => optional(key, isRecord),
    array: (key: string) => required(key, Array.isArray),
    optionalArray: (key: string) => optional(key, Array.isArray),
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function readList<T>(
  items: unknown[],
  path: string,
  read: (item: UnknownRecord, path: string) => T,
): T[] {
  return items.map((item, index) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(item)) throw new InvalidAuditReportError(itemPath)
    return read(item, itemPath)
  })
}

function readStringList(items: unknown[], path: string): string[] {
  return items.map((item, index) => {
    if (!isString(item)) throw new InvalidAuditReportError(`${path}[${index}]`)
    return item
  })
}

function readEvidence(item: UnknownRecord, path: string): FindingEvidence {
  const field = fieldsOf(item, path)
  return {
    kind: field.oneOf('kind', EVIDENCE_KINDS),
    summary: field.string('summary'),
    selector: field.optionalString('selector'),
    observedValue: field.optionalString('observedValue'),
  }
}

function readContrastDetails(
  record: UnknownRecord,
  path: string,
): NonNullable<Violation['contrastDetails']> {
  const field = fieldsOf(record, path)
  return {
    context: field.oneOf('context', CONTRAST_CONTEXTS),
    foregroundHex: field.string('foregroundHex'),
    backgroundHex: field.string('backgroundHex'),
    measuredRatio: field.number('measuredRatio'),
    minimumRatio: field.number('minimumRatio'),
    comparisonHex: field.optionalString('comparisonHex'),
    comparisonLabel: field.optionalString('comparisonLabel'),
    foregroundLabel: field.optionalString('foregroundLabel'),
    backgroundLabel: field.optionalString('backgroundLabel'),
  }
}

function readContrastOverride(
  record: UnknownRecord,
  path: string,
): NonNullable<Violation['userContrastOverride']> {
  const field = fieldsOf(record, path)
  return {
    foregroundHex: field.string('foregroundHex'),
    backgroundHex: field.string('backgroundHex'),
    updatedAt: field.number('updatedAt'),
  }
}

function readAlternativeTextReview(
  record: UnknownRecord,
  path: string,
): NonNullable<Violation['alternativeTextReview']> {
  const field = fieldsOf(record, path)
  return {
    currentText: field.optionalString('currentText'),
    currentSource: field.oneOf('currentSource', ALTERNATIVE_TEXT_SOURCES),
    proposedText: field.optionalString('proposedText'),
    targetAttribute: field.oneOf('targetAttribute', ALTERNATIVE_TEXT_TARGETS),
    updatedAt: field.optionalNumber('updatedAt'),
  }
}

function readViolation(record: UnknownRecord, path: string): Violation {
  const field = fieldsOf(record, path)
  const id = field.string('id')
  const evidence = field.optionalArray('evidence')
  const contrastDetails = field.optionalRecord('contrastDetails')
  const userContrastOverride = field.optionalRecord('userContrastOverride')
  const alternativeTextReview = field.optionalRecord('alternativeTextReview')

  const violation: Partial<Violation> = {
    id,
    customId: field.optionalString('customId') ?? id,
    ruleId: field.string('ruleId'),
    ruleName: field.string('ruleName'),
    nbrReference: field.string('nbrReference'),
    description: field.string('description'),
    severity: field.oneOf('severity', SEVERITIES),
    wcagLevel: field.oneOf('wcagLevel', WCAG_LEVELS),
    automationCategory: field.oneOf('automationCategory', AUTOMATION_CATEGORY_VALUES),
    verificationMode: field.optionalOneOf('verificationMode', VERIFICATION_MODES),
    auditScope: field.optionalOneOf('auditScope', AUDIT_SCOPES),
    confidence: field.optionalOneOf('confidence', CONFIDENCES),
    evidence: evidence && readList(evidence, `${path}.evidence`, readEvidence),
    reviewQuestion: field.optionalString('reviewQuestion'),
    normativeType: field.optionalOneOf('normativeType', NORMATIVE_TYPE_VALUES),
    requiresHumanReview: field.optionalBoolean('requiresHumanReview'),
    humanReviewStatus: field.optionalOneOf('humanReviewStatus', HUMAN_REVIEW_STATUSES),
    findingOrigin: field.optionalOneOf('findingOrigin', FINDING_ORIGINS),
    findingStatus: field.optionalOneOf('findingStatus', FINDING_STATUSES),
    ignoreReason: field.optionalOneOf('ignoreReason', IGNORE_REASONS),
    ignoreNote: field.optionalString('ignoreNote'),
    findingStatusUpdatedAt: field.optionalNumber('findingStatusUpdatedAt'),
    message: field.string('message'),
    snippet: field.optionalString('snippet') ?? '',
    suggestion: field.string('suggestion'),
    remediationAdvice: field.string('remediationAdvice'),
    elementSelector: field.optionalString('elementSelector'),
    elementTagName: field.optionalString('elementTagName'),
    elementAccessibleName: field.optionalString('elementAccessibleName'),
    elementVisibleText: field.optionalString('elementVisibleText'),
    contrastDetails:
      contrastDetails && readContrastDetails(contrastDetails, `${path}.contrastDetails`),
    userContrastOverride:
      userContrastOverride &&
      readContrastOverride(userContrastOverride, `${path}.userContrastOverride`),
    alternativeTextReview:
      alternativeTextReview &&
      readAlternativeTextReview(alternativeTextReview, `${path}.alternativeTextReview`),
    userNote: field.optionalString('userNote'),
    noteUpdatedAt: field.optionalNumber('noteUpdatedAt'),
  }

  // Validated above; the fields older exports lack are derived during normalization.
  return violation as Violation
}

function readPageContext(record: UnknownRecord, path: string): PageAuditContext {
  const field = fieldsOf(record, path)
  return {
    navigationSignatures: readStringList(
      field.array('navigationSignatures'),
      `${path}.navigationSignatures`,
    ),
    helpSignatures: readStringList(field.array('helpSignatures'), `${path}.helpSignatures`),
    locationMechanisms: readStringList(
      field.array('locationMechanisms'),
      `${path}.locationMechanisms`,
    ),
    controlActions: readList(field.array('controlActions'), `${path}.controlActions`, (item, p) => {
      const action = fieldsOf(item, p)
      return { action: action.string('action'), name: action.string('name') }
    }),
    criticalActions: readStringList(field.array('criticalActions'), `${path}.criticalActions`),
    formFieldKeys: readStringList(field.array('formFieldKeys'), `${path}.formFieldKeys`),
    hasReviewCue: field.optionalBoolean('hasReviewCue') ?? false,
  }
}

function readReviewCandidate(item: UnknownRecord, path: string): SessionReviewCandidate {
  const field = fieldsOf(item, path)
  return {
    ruleId: field.string('ruleId'),
    nbrReference: field.string('nbrReference'),
    summary: field.string('summary'),
    reviewQuestion: field.string('reviewQuestion'),
  }
}

function readSiteSession(record: UnknownRecord, path: string): SiteAuditSession {
  const field = fieldsOf(record, path)
  return {
    id: field.string('id'),
    origin: field.string('origin'),
    startedAt: field.number('startedAt'),
    updatedAt: field.number('updatedAt'),
    pages: readList(field.array('pages'), `${path}.pages`, (item, p) => {
      const page = fieldsOf(item, p)
      return {
        url: page.string('url'),
        pageTitle: page.optionalString('pageTitle'),
        auditedAt: page.number('auditedAt'),
        context: readPageContext(page.record('context'), `${p}.context`),
      }
    }),
    reviewCandidates: readList(
      field.array('reviewCandidates'),
      `${path}.reviewCandidates`,
      readReviewCandidate,
    ),
  }
}

function readJourneySession(record: UnknownRecord, path: string): JourneyAuditSession {
  const field = fieldsOf(record, path)
  return {
    id: field.string('id'),
    name: field.string('name'),
    startedAt: field.number('startedAt'),
    updatedAt: field.number('updatedAt'),
    steps: readList(field.array('steps'), `${path}.steps`, (item, p) => {
      const step = fieldsOf(item, p)
      return {
        id: step.string('id'),
        url: step.string('url'),
        pageTitle: step.optionalString('pageTitle'),
        label: step.string('label'),
        recordedAt: step.number('recordedAt'),
        evidenceSelectors: readStringList(
          step.array('evidenceSelectors'),
          `${p}.evidenceSelectors`,
        ),
        context: readPageContext(step.record('context'), `${p}.context`),
      }
    }),
    reviewCandidates: readList(
      field.array('reviewCandidates'),
      `${path}.reviewCandidates`,
      readReviewCandidate,
    ),
  }
}

/**
 * Reads an exported report, either the export envelope (`{ audit: … }`) or a bare audit result.
 * Totals and groupings are not read: they are derived again from the violations.
 */
export function readAuditReport(payload: unknown): AuditResult {
  if (!isRecord(payload)) throw new InvalidAuditReportError('$')
  const audit = isRecord(payload.audit) ? payload.audit : payload
  const path = audit === payload ? '$' : '$.audit'
  const field = fieldsOf(audit, path)

  const schemaVersion = field.optionalNumber('schemaVersion') ?? CURRENT_AUDIT_SCHEMA_VERSION
  if (schemaVersion > CURRENT_AUDIT_SCHEMA_VERSION) field.fail('schemaVersion')

  // Exports written before 1.1 stored the timestamp as a string.
  const rawTimestamp = audit.timestamp
  const timestamp = typeof rawTimestamp === 'string' ? Number(rawTimestamp) : rawTimestamp
  if (!isFiniteNumber(timestamp)) return field.fail('timestamp')

  const url = field.string('url')
  if (!URL.canParse(url)) field.fail('url')

  const siteSession = field.optionalRecord('siteSession')
  const journeySession = field.optionalRecord('journeySession')
  const ruleExecution = field.optionalRecord('ruleExecution')
  const executionField = ruleExecution && fieldsOf(ruleExecution, `${path}.ruleExecution`)

  const result: Partial<AuditResult> = {
    schemaVersion,
    id: field.optionalString('id'),
    timestamp,
    url,
    pageTitle: field.optionalString('pageTitle'),
    includeRecommendations: field.optionalBoolean('includeRecommendations'),
    includeHumanReview: field.optionalBoolean('includeHumanReview'),
    auditScope: field.optionalOneOf('auditScope', AUDIT_SCOPES),
    siteSession: siteSession && readSiteSession(siteSession, `${path}.siteSession`),
    journeySession: journeySession && readJourneySession(journeySession, `${path}.journeySession`),
    ruleExecution: executionField && {
      executed: executionField.number('executed'),
      withCandidates: executionField.number('withCandidates'),
      awaitingManualReview: executionField.number('awaitingManualReview'),
    },
    violations: readList(field.array('violations'), `${path}.violations`, readViolation),
  }

  // Totals, groupings and the score range are derived from the violations during normalization.
  return result as AuditResult
}
