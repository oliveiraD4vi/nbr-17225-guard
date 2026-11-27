import React from 'react'
import { Alert, Button, Collapse, Select, Space, Tag } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { t } from '@/i18n'
import type { AuditHistoryEntry, IgnoreReason, Violation } from '@/types'
import type {
  AuditComparisonSummary,
  AuditReviewChange,
  AuditReviewChangeField,
  AuditStateChange,
} from '@/utils/audit-comparison'

export interface ComparisonTrend {
  icon: React.ReactNode
  label: string
  color: 'green' | 'red' | 'gold' | 'default'
}

interface AuditComparisonCardProps {
  entries: AuditHistoryEntry[]
  baselineId?: string
  targetId?: string
  summary: AuditComparisonSummary | null
  trend: ComparisonTrend | null
  onBaselineChange: (historyId: string) => void
  onTargetChange: (historyId: string) => void
  onExportMarkdown: () => void
  onExportJson: () => void
  onExportCsv: () => void
}

function getHistoryOptionLabel(entry: AuditHistoryEntry): string {
  return t('popup.history.optionLabel', {
    date: new Date(entry.timestamp).toLocaleString('pt-BR'),
    count: entry.totalViolations,
  })
}

function getViolationElementLabel(violation: Violation): string {
  return (
    violation.elementAccessibleName ||
    violation.elementVisibleText ||
    violation.elementSelector ||
    violation.elementTagName ||
    t('popup.history.comparisonUnknownElement')
  )
}

function getFindingStatusLabel(status: Violation['findingStatus']): string {
  if (status === 'ignored') return t('popup.history.comparisonStatusIgnored')
  if (status === 'confirmed') return t('popup.history.comparisonStatusRegistered')
  return t('popup.history.comparisonStatusOpen')
}

function getIgnoreReasonLabel(reason?: IgnoreReason): string {
  if (!reason) return t('popup.history.comparisonEmptyValue')
  const labels: Record<IgnoreReason, string> = {
    false_positive: t('violations.ignoreReasons.falsePositive'),
    out_of_scope: t('violations.ignoreReasons.outOfScope'),
    accepted_risk: t('violations.ignoreReasons.acceptedRisk'),
    duplicate: t('violations.ignoreReasons.duplicate'),
    other: t('violations.ignoreReasons.other'),
  }
  return labels[reason]
}

function getTriageChangeLabel(change: AuditStateChange): string {
  if (change.kind === 'ignored') return t('popup.history.comparisonIgnored')
  if (change.kind === 'reopened') return t('popup.history.comparisonReopened')
  if (change.kind === 'status_updated') return t('popup.history.comparisonStatusUpdated')
  return t('popup.history.comparisonTriageUpdated')
}

function getReviewFieldLabel(field: AuditReviewChangeField): string {
  if (field === 'user_note') return t('popup.history.comparisonFieldNote')
  if (field === 'alternative_text') return t('popup.history.comparisonFieldAlternativeText')
  if (field === 'contrast') return t('popup.history.comparisonFieldContrast')
  return t('popup.history.comparisonFieldContent')
}

function formatComparisonValue(value?: string): string {
  return value?.trim() || t('popup.history.comparisonEmptyValue')
}

function getContrastValue(violation: Violation): string {
  const contrast = violation.userContrastOverride
  return contrast
    ? `${contrast.foregroundHex} / ${contrast.backgroundHex}`
    : t('popup.history.comparisonEmptyValue')
}

function ComparisonSectionHeader({ count, label }: { count: number; label: string }) {
  return (
    <div className="history-comparison-section-header">
      <strong>{count}</strong>
      <span>{label}</span>
    </div>
  )
}

function ComparisonViolationList({ violations }: { violations: Violation[] }) {
  return (
    <div className="history-comparison-change-list">
      {violations.map((violation) => (
        <div key={violation.id} className="history-comparison-change-item">
          <strong>
            NBR {violation.nbrReference} · {violation.ruleName}
          </strong>
          <span>{violation.message}</span>
          <code>{getViolationElementLabel(violation)}</code>
        </div>
      ))}
    </div>
  )
}

function ComparisonTriageList({ changes }: { changes: AuditStateChange[] }) {
  return (
    <div className="history-comparison-change-list">
      {changes.map((change) => (
        <div key={change.target.id} className="history-comparison-change-item">
          <div className="history-comparison-change-heading">
            <strong>
              NBR {change.target.nbrReference} · {change.target.ruleName}
            </strong>
            <Tag>{getTriageChangeLabel(change)}</Tag>
          </div>
          <span>
            {t('popup.history.comparisonStatusTransition', {
              from: getFindingStatusLabel(change.baseline.findingStatus),
              to: getFindingStatusLabel(change.target.findingStatus),
            })}
          </span>
          {(change.baseline.ignoreReason !== change.target.ignoreReason ||
            change.baseline.ignoreNote !== change.target.ignoreNote) && (
            <div className="history-comparison-value-grid">
              <span>
                {t('popup.history.comparisonReasonTransition', {
                  from: getIgnoreReasonLabel(change.baseline.ignoreReason),
                  to: getIgnoreReasonLabel(change.target.ignoreReason),
                })}
              </span>
              <span>
                {t('popup.history.comparisonNoteTransition', {
                  from: formatComparisonValue(change.baseline.ignoreNote),
                  to: formatComparisonValue(change.target.ignoreNote),
                })}
              </span>
            </div>
          )}
          <code>{getViolationElementLabel(change.target)}</code>
        </div>
      ))}
    </div>
  )
}

function ComparisonReviewList({ changes }: { changes: AuditReviewChange[] }) {
  return (
    <div className="history-comparison-change-list">
      {changes.map((change) => (
        <div key={change.target.id} className="history-comparison-change-item">
          <div className="history-comparison-change-heading">
            <strong>
              NBR {change.target.nbrReference} · {change.target.ruleName}
            </strong>
            <div>
              {change.changedFields.map((field) => (
                <Tag key={field}>{getReviewFieldLabel(field)}</Tag>
              ))}
            </div>
          </div>
          {change.changedFields.includes('user_note') && (
            <span>
              {t('popup.history.comparisonValueTransition', {
                label: getReviewFieldLabel('user_note'),
                from: formatComparisonValue(change.baseline.userNote),
                to: formatComparisonValue(change.target.userNote),
              })}
            </span>
          )}
          {change.changedFields.includes('alternative_text') && (
            <span>
              {t('popup.history.comparisonValueTransition', {
                label: getReviewFieldLabel('alternative_text'),
                from: formatComparisonValue(change.baseline.alternativeTextReview?.proposedText),
                to: formatComparisonValue(change.target.alternativeTextReview?.proposedText),
              })}
            </span>
          )}
          {change.changedFields.includes('contrast') && (
            <span>
              {t('popup.history.comparisonValueTransition', {
                label: getReviewFieldLabel('contrast'),
                from: getContrastValue(change.baseline),
                to: getContrastValue(change.target),
              })}
            </span>
          )}
          {change.changedFields.includes('violation_content') && (
            <span>
              {t('popup.history.comparisonValueTransition', {
                label: getReviewFieldLabel('violation_content'),
                from: change.baseline.message,
                to: change.target.message,
              })}
            </span>
          )}
          <code>{getViolationElementLabel(change.target)}</code>
        </div>
      ))}
    </div>
  )
}

/** Compares two audits of the same page: what appeared, what went away and what was reviewed. */
export function AuditComparisonCard({
  entries,
  baselineId,
  targetId,
  summary,
  trend,
  onBaselineChange,
  onTargetChange,
  onExportMarkdown,
  onExportJson,
  onExportCsv,
}: AuditComparisonCardProps) {
  return (
    <div className="history-comparison-card">
      <div className="history-comparison-header">
        <div>
          <strong>{t('popup.history.comparisonTitle')}</strong>
          <p>{t('popup.history.comparisonDescription')}</p>
        </div>
        <Space>
          {trend && (
            <Tag color={trend.color}>
              {trend.icon} {trend.label}
            </Tag>
          )}
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExportMarkdown}
            disabled={!summary}
          >
            {t('shared.actions.exportMarkdown')}
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExportJson}
            disabled={!summary}
          >
            {t('shared.actions.json')}
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExportCsv}
            disabled={!summary}
          >
            {t('shared.actions.csv')}
          </Button>
        </Space>
      </div>

      <div className="history-comparison-selectors">
        <div className="history-comparison-field">
          <span>{t('shared.labels.base')}</span>
          <Select
            aria-label={t('shared.labels.base')}
            value={baselineId}
            onChange={onBaselineChange}
            options={entries.map((entry) => ({
              value: entry.id,
              label: getHistoryOptionLabel(entry),
            }))}
          />
        </div>
        <div className="history-comparison-field">
          <span>{t('shared.labels.compareWith')}</span>
          <Select
            aria-label={t('shared.labels.compareWith')}
            value={targetId}
            onChange={onTargetChange}
            options={entries.map((entry) => ({
              value: entry.id,
              label: getHistoryOptionLabel(entry),
            }))}
          />
        </div>
      </div>

      {summary ? (
        <div className="history-comparison-body">
          {summary.comparisonScope.mode === 'partial' && (
            <Alert
              type="warning"
              showIcon
              message={t('popup.history.comparisonPartialScopeTitle')}
              description={t('popup.history.comparisonPartialScopeDescription')}
            />
          )}
          <div className="history-comparison-meta">
            <span>
              {t('popup.history.metadataVisible', {
                from: summary.baselineOpenCount,
                to: summary.targetOpenCount,
              })}
            </span>
            <span>
              {t('popup.history.metadataIgnored', {
                from: summary.baselineDismissedReviews,
                to: summary.targetDismissedReviews,
              })}
            </span>
            <span>
              {t('popup.history.metadataPending', {
                from: summary.baselinePendingReviews,
                to: summary.targetPendingReviews,
              })}
            </span>
            <span>
              {t('popup.history.metadataNotes', {
                from: summary.baselineNoteCount,
                to: summary.targetNoteCount,
              })}
            </span>
          </div>

          <Collapse
            className="history-comparison-details"
            items={[
              {
                key: 'new',
                label: (
                  <ComparisonSectionHeader
                    count={summary.newViolations.length}
                    label={t('popup.history.newProblems')}
                  />
                ),
                children: <ComparisonViolationList violations={summary.newViolations} />,
              },
              {
                key: 'not-detected',
                label: (
                  <ComparisonSectionHeader
                    count={summary.noLongerDetectedViolations.length}
                    label={t('popup.history.resolvedProblems')}
                  />
                ),
                children: (
                  <ComparisonViolationList violations={summary.noLongerDetectedViolations} />
                ),
              },
              {
                key: 'persistent',
                label: (
                  <ComparisonSectionHeader
                    count={summary.persistentViolations.length}
                    label={t('popup.history.persistentProblems')}
                  />
                ),
                children: <ComparisonViolationList violations={summary.persistentViolations} />,
              },
              {
                key: 'triage',
                label: (
                  <ComparisonSectionHeader
                    count={summary.stateChangedViolations.length}
                    label={t('popup.history.stateChangedFindings')}
                  />
                ),
                children: <ComparisonTriageList changes={summary.stateChangedViolations} />,
              },
              {
                key: 'review',
                label: (
                  <ComparisonSectionHeader
                    count={summary.reviewChangedViolations.length}
                    label={t('popup.history.reviewChangedRecords')}
                  />
                ),
                children: <ComparisonReviewList changes={summary.reviewChangedViolations} />,
              },
            ]}
          />
        </div>
      ) : (
        <Alert type="info" showIcon message={t('popup.messages.comparisonSelectInfo')} />
      )}
    </div>
  )
}
