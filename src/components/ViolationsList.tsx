import React from 'react'
import {
  Button,
  Card,
  Collapse,
  ColorPicker,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
} from 'antd'
import {
  BoldOutlined,
  BgColorsOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ItalicOutlined,
  LinkOutlined,
  PushpinFilled,
  SaveOutlined,
  SearchOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { t } from '@/i18n'
import { isNormativeRequirement } from '@/normative'
import { getRuleTopicCategory, type RuleTopicCategory } from '@/rules'
import type { HumanReviewStatus, Violation } from '@/types'
import { getContrastRatio } from '@/utils'
import '../styles/violations-list.css'

interface ViolationsListProps {
  violations: Violation[]
  onSelectViolation?: (violation: Violation) => void
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void
  onViolationNoteChange?: (violation: Violation, note: string) => void
  onViolationContrastOverrideChange?: (
    violation: Violation,
    override: Violation['userContrastOverride'] | undefined,
  ) => void
}

interface ViolationGroup {
  ruleId: string
  violations: Violation[]
  topIssueCount: number
  topicCategory: RuleTopicCategory
}

interface TruncatedTextProps {
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  lines?: 1 | 2 | 3 | 4
  monospace?: boolean
  preserveWhitespace?: boolean
  text: string
  tooltipThreshold?: number
}

const { TextArea } = Input
const REVIEW_STATUS_TRANSITION_MS = 220

const severityRank: Record<Violation['severity'], number> = {
  error: 0,
  warning: 1,
}

function getSeverityColor(severity: Violation['severity']): string {
  return severity === 'error' ? 'red' : 'orange'
}

function getSeverityLabel(severity: Violation['severity']): string {
  return severity === 'error' ? t('shared.severity.error') : t('shared.severity.warning')
}

function getNormativeTypeLabel(violation: Violation): string {
  return violation.normativeType
}

function getReviewLabel(violation: Violation): string {
  if (!violation.requiresHumanReview) return t('shared.states.automaticDetection')
  if (violation.humanReviewStatus === 'confirmed') return t('shared.review.confirmedNeedsFix')
  if (violation.humanReviewStatus === 'dismissed') return t('shared.review.dismissed')
  return t('shared.review.needsConfirmation')
}

function getReviewStatusTagColor(status: HumanReviewStatus): string {
  if (status === 'confirmed') return 'red'
  if (status === 'dismissed') return 'default'
  return 'gold'
}

function getHumanReviewActionOptions(
  currentStatus: HumanReviewStatus,
): Array<{ icon: React.ReactNode; label: string; targetStatus: HumanReviewStatus }> {
  if (currentStatus === 'confirmed') {
    return [
      {
        icon: <UndoOutlined />,
        label: t('violations.reviewActionReturnToPending'),
        targetStatus: 'pending',
      },
      {
        icon: <CloseCircleOutlined />,
        label: t('violations.reviewActionDismiss'),
        targetStatus: 'dismissed',
      },
    ]
  }

  if (currentStatus === 'dismissed') {
    return [
      {
        icon: <UndoOutlined />,
        label: t('violations.reviewActionReturnToPending'),
        targetStatus: 'pending',
      },
      {
        icon: <CheckCircleOutlined />,
        label: t('violations.reviewActionConfirm'),
        targetStatus: 'confirmed',
      },
    ]
  }

  return [
    {
      icon: <CheckCircleOutlined />,
      label: t('violations.reviewActionConfirm'),
      targetStatus: 'confirmed',
    },
    {
      icon: <CloseCircleOutlined />,
      label: t('violations.reviewActionDismiss'),
      targetStatus: 'dismissed',
    },
  ]
}

function getReviewTransitionTitle(targetStatus: HumanReviewStatus): string {
  if (targetStatus === 'confirmed') return t('violations.reviewConfirmConfirmedTitle')
  if (targetStatus === 'dismissed') return t('violations.reviewConfirmDismissedTitle')
  return t('violations.reviewConfirmPendingTitle')
}

function getReviewTransitionDescription(targetStatus: HumanReviewStatus): string {
  if (targetStatus === 'confirmed') return t('violations.reviewConfirmConfirmedDescription')
  if (targetStatus === 'dismissed') return t('violations.reviewConfirmDismissedDescription')
  return t('violations.reviewConfirmPendingDescription')
}

function isVisibleInMainLists(violation: Violation): boolean {
  return !(violation.requiresHumanReview && violation.humanReviewStatus === 'dismissed')
}

function getViolationSignature(violation: Violation): string {
  return `${violation.message}|${violation.elementSelector || violation.snippet}`
}

function sortViolations(violations: Violation[]): Violation[] {
  return [...violations].sort((left, right) => {
    const severityCompare = severityRank[left.severity] - severityRank[right.severity]
    if (severityCompare !== 0) return severityCompare

    const leftSelector = left.elementSelector || ''
    const rightSelector = right.elementSelector || ''
    return leftSelector.localeCompare(rightSelector, 'pt-BR')
  })
}

function buildGroups(violations: Violation[]): ViolationGroup[] {
  const groupedByRule = violations.reduce(
    (acc, violation) => {
      if (!acc[violation.ruleId]) {
        acc[violation.ruleId] = []
      }
      acc[violation.ruleId].push(violation)
      return acc
    },
    {} as Record<string, Violation[]>,
  )

  return Object.entries(groupedByRule)
    .map(([ruleId, ruleViolations]) => ({
      ruleId,
      violations: sortViolations(ruleViolations),
      topIssueCount: new Set(ruleViolations.slice(0, 3).map(getViolationSignature)).size,
      topicCategory: getRuleTopicCategory(ruleId),
    }))
    .sort((left, right) => {
      const leftFirst = left.violations[0]
      const rightFirst = right.violations[0]
      const severityCompare = severityRank[leftFirst.severity] - severityRank[rightFirst.severity]
      if (severityCompare !== 0) return severityCompare
      if (right.violations.length !== left.violations.length)
        return right.violations.length - left.violations.length
      return leftFirst.nbrReference.localeCompare(rightFirst.nbrReference, 'pt-BR')
    })
}

function getRuleTopicLabel(topicCategory: RuleTopicCategory): string {
  return t(`ruleTopics.${topicCategory}`)
}

function getContrastPreviewText(
  context: NonNullable<Violation['contrastDetails']>['context'],
): string {
  return t(`contrast.preview.${context}`)
}

function getElementTitle(violation: Violation): string {
  const tag = violation.elementTagName || 'elemento'
  const selector = violation.elementSelector || ''
  const selectorSuffix = selector.startsWith(tag) ? selector.slice(tag.length) : selector
  return `${tag}${selectorSuffix ? ` ${selectorSuffix}` : ''}`
}

const TruncatedText: React.FC<TruncatedTextProps> = React.memo(
  ({
    as = 'span',
    className,
    lines = 2,
    monospace = false,
    preserveWhitespace = false,
    text,
    tooltipThreshold = 120,
  }) => {
    const Component = as
    const classes = [
      className,
      'violation-clamp',
      `lines-${lines}`,
      monospace ? 'is-monospace' : '',
      preserveWhitespace ? 'is-preformatted' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const content = <Component className={classes}>{text}</Component>
    const shouldShowTooltip = text.trim().length > tooltipThreshold

    if (!shouldShowTooltip) return content

    return (
      <Tooltip
        placement="topLeft"
        title={
          <div
            className={`violation-tooltip-copy${preserveWhitespace ? ' is-preformatted' : ''}${monospace ? ' is-monospace' : ''}`}
          >
            {text}
          </div>
        }
      >
        {content}
      </Tooltip>
    )
  },
)

function renderViolationGroups(
  violations: Violation[],
  onSelectViolation?: (violation: Violation) => void,
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void,
  onViolationNoteChange?: (violation: Violation, note: string) => void,
  onViolationContrastOverrideChange?: (
    violation: Violation,
    override: Violation['userContrastOverride'] | undefined,
  ) => void,
): React.ReactNode {
  if (violations.length === 0) {
    return <Empty description={t('violations.emptyCategory')} />
  }

  const groups = buildGroups(violations)
  const topRuleIds = new Set(groups.slice(0, 3).map((group) => group.ruleId))

  const items = groups.map((group) => {
    const firstViolation = group.violations[0]
    const topIssues = group.violations.slice(0, 3)
    const remainingIssues = group.violations.slice(3)

    return {
      key: group.ruleId,
      label: (
        <div className="violation-group-header">
          <div className="violation-group-main">
            <div className="violation-group-title-row">
              <span className="violation-rule-name">{firstViolation.ruleName}</span>
              <Tag color="blue">{getRuleTopicLabel(group.topicCategory)}</Tag>
              {topRuleIds.has(group.ruleId) && (
                <Tag className="violation-top-tag" color="volcano">
                  <PushpinFilled /> {t('shared.states.priority')}
                </Tag>
              )}
            </div>
            <span className="violation-group-description">{firstViolation.description}</span>
          </div>
          <div className="violation-group-meta">
            <Tag color={isNormativeRequirement(firstViolation.nbrReference) ? 'red' : 'blue'}>
              {getNormativeTypeLabel(firstViolation)}
            </Tag>
            <Tag color={getSeverityColor(firstViolation.severity)}>
              {getSeverityLabel(firstViolation.severity)}
            </Tag>
            {firstViolation.requiresHumanReview && (
              <Tag color="gold">{t('shared.states.humanConfirmation')}</Tag>
            )}
            <Tag>{t('shared.counts.occurrences', { count: group.violations.length })}</Tag>
            <span className="violation-nbr-ref">NBR {firstViolation.nbrReference}</span>
          </div>
        </div>
      ),
      children: (
        <div className="violation-details">
          <div className="violation-top-issues">
            <div className="violation-section-header">
              <strong>{t('violations.topIssues')}</strong>
              <span>{t('shared.counts.priorityPoints', { count: group.topIssueCount })}</span>
            </div>
            <div className="violation-items">
              {topIssues.map((violation, index) => (
                <ViolationCard
                  key={violation.id}
                  violation={violation}
                  index={index}
                  onSelectViolation={onSelectViolation}
                  onHumanReviewStatusChange={onHumanReviewStatusChange}
                  onViolationNoteChange={onViolationNoteChange}
                  onViolationContrastOverrideChange={onViolationContrastOverrideChange}
                  pinned
                />
              ))}
            </div>
          </div>

          {remainingIssues.length > 0 && (
            <div className="violation-more-issues">
              <div className="violation-section-header">
                <strong>{t('violations.otherOccurrences')}</strong>
                <span>{t('shared.counts.items', { count: remainingIssues.length })}</span>
              </div>
              <div className="violation-items">
                {remainingIssues.map((violation, index) => (
                  <ViolationCard
                    key={violation.id}
                    violation={violation}
                    index={topIssues.length + index}
                    onSelectViolation={onSelectViolation}
                    onHumanReviewStatusChange={onHumanReviewStatusChange}
                    onViolationNoteChange={onViolationNoteChange}
                    onViolationContrastOverrideChange={onViolationContrastOverrideChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    }
  })

  return <Collapse items={items} />
}

function renderReviewSections(
  violations: Violation[],
  onSelectViolation?: (violation: Violation) => void,
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void,
  onViolationNoteChange?: (violation: Violation, note: string) => void,
  onViolationContrastOverrideChange?: (
    violation: Violation,
    override: Violation['userContrastOverride'] | undefined,
  ) => void,
): React.ReactNode {
  if (violations.length === 0) {
    return <Empty description={t('violations.emptyCategory')} />
  }

  const pendingViolations = violations.filter(
    (violation) => violation.humanReviewStatus === 'pending',
  )
  const confirmedViolations = violations.filter(
    (violation) => violation.humanReviewStatus === 'confirmed',
  )
  const dismissedViolations = violations.filter(
    (violation) => violation.humanReviewStatus === 'dismissed',
  )

  const sections = [
    {
      key: 'pending',
      title: t('violations.reviewSections.pending'),
      description: t('violations.reviewSections.pendingDescription'),
      count: pendingViolations.length,
      colorClassName: 'is-pending',
      violations: pendingViolations,
    },
    {
      key: 'confirmed',
      title: t('violations.reviewSections.confirmed'),
      description: t('violations.reviewSections.confirmedDescription'),
      count: confirmedViolations.length,
      colorClassName: 'is-confirmed',
      violations: confirmedViolations,
    },
    {
      key: 'dismissed',
      title: t('violations.reviewSections.dismissed'),
      description: t('violations.reviewSections.dismissedDescription'),
      count: dismissedViolations.length,
      colorClassName: 'is-dismissed',
      violations: dismissedViolations,
    },
  ]

  return (
    <div className="review-sections">
      {sections.map((section) => (
        <section key={section.key} className={`review-section ${section.colorClassName}`}>
          <div className="review-section-header">
            <div>
              <strong>{section.title}</strong>
              <p>{section.description}</p>
            </div>
            <Tag>{t('shared.counts.items', { count: section.count })}</Tag>
          </div>
          {section.count > 0 ? (
            renderViolationGroups(
              section.violations,
              onSelectViolation,
              onHumanReviewStatusChange,
              onViolationNoteChange,
              onViolationContrastOverrideChange,
            )
          ) : (
            <Empty
              description={t('violations.emptyCategory')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </section>
      ))}
    </div>
  )
}

interface ViolationCardProps {
  violation: Violation
  index: number
  onSelectViolation?: (violation: Violation) => void
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void
  onViolationNoteChange?: (violation: Violation, note: string) => void
  onViolationContrastOverrideChange?: (
    violation: Violation,
    override: Violation['userContrastOverride'] | undefined,
  ) => void
  pinned?: boolean
}

const ViolationCard: React.FC<ViolationCardProps> = React.memo(
  ({
    violation,
    index,
    onSelectViolation,
    onHumanReviewStatusChange,
    onViolationNoteChange,
    onViolationContrastOverrideChange,
    pinned = false,
  }) => {
    const [isNotesOpen, setIsNotesOpen] = React.useState(false)
    const [isContrastModalOpen, setIsContrastModalOpen] = React.useState(false)
    const [pendingReviewStatus, setPendingReviewStatus] = React.useState<HumanReviewStatus | null>(
      null,
    )
    const [isApplyingReviewDecision, setIsApplyingReviewDecision] = React.useState(false)
    const [noteDraft, setNoteDraft] = React.useState(violation.userNote || '')
    const [foregroundHex, setForegroundHex] = React.useState(
      violation.userContrastOverride?.foregroundHex ||
        violation.contrastDetails?.foregroundHex ||
        '#000000',
    )
    const [backgroundHex, setBackgroundHex] = React.useState(
      violation.userContrastOverride?.backgroundHex ||
        violation.contrastDetails?.backgroundHex ||
        '#ffffff',
    )

    React.useEffect(() => {
      setNoteDraft(violation.userNote || '')
    }, [violation.id, violation.userNote])

    React.useEffect(() => {
      setForegroundHex(
        violation.userContrastOverride?.foregroundHex ||
          violation.contrastDetails?.foregroundHex ||
          '#000000',
      )
      setBackgroundHex(
        violation.userContrastOverride?.backgroundHex ||
          violation.contrastDetails?.backgroundHex ||
          '#ffffff',
      )
    }, [violation.contrastDetails, violation.id, violation.userContrastOverride])

    React.useEffect(() => {
      setPendingReviewStatus(null)
      setIsApplyingReviewDecision(false)
    }, [violation.humanReviewStatus, violation.id])

    const insertAtEnd = React.useCallback((value: string) => {
      setNoteDraft((current) => `${current}${current ? '\n' : ''}${value}`)
    }, [])

    const handleSaveNote = React.useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        onViolationNoteChange?.(violation, noteDraft.trim())
      },
      [noteDraft, onViolationNoteChange, violation],
    )

    const handleCardClick = React.useCallback(() => {
      onSelectViolation?.(violation)
    }, [onSelectViolation, violation])

    const contrastRatio = React.useMemo(() => {
      if (!violation.contrastDetails) return null
      return getContrastRatio(foregroundHex, backgroundHex)
    }, [backgroundHex, foregroundHex, violation.contrastDetails])
    const persistedContrastRatio = React.useMemo(() => {
      if (!violation.contrastDetails) return null
      if (!violation.userContrastOverride) return violation.contrastDetails.measuredRatio
      return getContrastRatio(
        violation.userContrastOverride.foregroundHex,
        violation.userContrastOverride.backgroundHex,
      )
    }, [violation.contrastDetails, violation.userContrastOverride])

    const contrastPasses = React.useMemo(
      () =>
        violation.contrastDetails && contrastRatio !== null
          ? contrastRatio >= violation.contrastDetails.minimumRatio
          : false,
      [contrastRatio, violation.contrastDetails],
    )
    const hasUnsavedContrastChanges = React.useMemo(() => {
      if (!violation.contrastDetails) return false

      const referenceForeground =
        violation.userContrastOverride?.foregroundHex || violation.contrastDetails.foregroundHex
      const referenceBackground =
        violation.userContrastOverride?.backgroundHex || violation.contrastDetails.backgroundHex

      return (
        referenceForeground.toLowerCase() !== foregroundHex.toLowerCase() ||
        referenceBackground.toLowerCase() !== backgroundHex.toLowerCase()
      )
    }, [backgroundHex, foregroundHex, violation.contrastDetails, violation.userContrastOverride])

    const handleSaveContrastOverride = React.useCallback(() => {
      if (!violation.contrastDetails) return
      onViolationContrastOverrideChange?.(violation, {
        foregroundHex,
        backgroundHex,
        updatedAt: Date.now(),
      })
    }, [backgroundHex, foregroundHex, onViolationContrastOverrideChange, violation])

    const handleClearContrastOverride = React.useCallback(() => {
      if (!violation.contrastDetails) return
      setForegroundHex(violation.contrastDetails.foregroundHex)
      setBackgroundHex(violation.contrastDetails.backgroundHex)
      onViolationContrastOverrideChange?.(violation, undefined)
    }, [onViolationContrastOverrideChange, violation])

    const reviewActions = React.useMemo(
      () => getHumanReviewActionOptions(violation.humanReviewStatus),
      [violation.humanReviewStatus],
    )
    const reviewTransitionTargetStatus = pendingReviewStatus ?? violation.humanReviewStatus
    const isReviewDecisionPending =
      pendingReviewStatus !== null && pendingReviewStatus !== violation.humanReviewStatus

    const handleRequestReviewStatusChange = React.useCallback(
      (event: React.MouseEvent<HTMLElement>, nextStatus: HumanReviewStatus) => {
        event.stopPropagation()
        if (isApplyingReviewDecision || nextStatus === violation.humanReviewStatus) return
        setPendingReviewStatus(nextStatus)
      },
      [isApplyingReviewDecision, violation.humanReviewStatus],
    )

    const handleCancelReviewStatusChange = React.useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        if (isApplyingReviewDecision) return
        setPendingReviewStatus(null)
      },
      [isApplyingReviewDecision],
    )

    const handleConfirmReviewStatusChange = React.useCallback(
      async (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        if (!pendingReviewStatus || pendingReviewStatus === violation.humanReviewStatus) return

        setIsApplyingReviewDecision(true)
        window.setTimeout(() => {
          void onHumanReviewStatusChange?.(violation, pendingReviewStatus)
        }, REVIEW_STATUS_TRANSITION_MS)
      },
      [onHumanReviewStatusChange, pendingReviewStatus, violation],
    )

    return (
      <Card
        size="small"
        className={`violation-item-card${pinned ? ' is-pinned' : ''} review-state-${violation.humanReviewStatus}${isApplyingReviewDecision ? ' is-review-transitioning' : ''}${isApplyingReviewDecision ? ` is-review-transitioning-to-${reviewTransitionTargetStatus}` : ''}`}
        onClick={handleCardClick}
      >
        <div className="violation-item-header">
          <span className="violation-item-number">#{index + 1}</span>
          <div className="violation-item-heading">
            <TruncatedText
              className="violation-item-message"
              lines={2}
              text={violation.message}
              tooltipThreshold={110}
            />
            <span className="violation-item-reference">
              NBR {violation.nbrReference} - WCAG {violation.wcagLevel}
            </span>
          </div>
        </div>

        <div className="violation-item-content">
          {violation.requiresHumanReview && (
            <div className="violation-human-review-card">
              <strong>{t('violations.requiresHumanReviewTitle')}</strong>
              <p>{t('violations.requiresHumanReviewDescription')}</p>
              {violation.inheritedFromHistory && (
                <Tag color="blue">{t('shared.states.inherited')}</Tag>
              )}
              <Tag color={getReviewStatusTagColor(violation.humanReviewStatus)}>
                {getReviewLabel(violation)}
              </Tag>
              <div
                className="violation-human-review-controls"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <Space wrap size={8}>
                  {reviewActions.map((action) => (
                    <Button
                      key={action.targetStatus}
                      icon={action.icon}
                      loading={
                        isApplyingReviewDecision &&
                        reviewTransitionTargetStatus === action.targetStatus
                      }
                      size="small"
                      type={
                        pendingReviewStatus === action.targetStatus ||
                        violation.humanReviewStatus === action.targetStatus
                          ? 'primary'
                          : 'default'
                      }
                      onClick={(event) =>
                        handleRequestReviewStatusChange(event, action.targetStatus)
                      }
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
                {isReviewDecisionPending && (
                  <div className="violation-human-review-confirmation" aria-live="polite">
                    <div className="violation-human-review-confirmation-copy">
                      <strong>{getReviewTransitionTitle(pendingReviewStatus)}</strong>
                      <p>{getReviewTransitionDescription(pendingReviewStatus)}</p>
                    </div>
                    <Space wrap size={8}>
                      <Button size="small" onClick={handleCancelReviewStatusChange}>
                        {t('violations.reviewConfirmCancel')}
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={handleConfirmReviewStatusChange}
                      >
                        {t('violations.reviewConfirmApply')}
                      </Button>
                    </Space>
                  </div>
                )}
                {isApplyingReviewDecision && (
                  <span className="violation-human-review-transition-note" aria-live="polite">
                    {t('violations.reviewTransitionApplying')}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="violation-element-card">
            <strong>{t('shared.labels.affectedElement')}</strong>
            <TruncatedText
              as="div"
              className="violation-element-title"
              lines={2}
              monospace
              text={getElementTitle(violation)}
              tooltipThreshold={90}
            />

            <div className="violation-element-fields">
              {violation.elementAccessibleName && (
                <div className="violation-element-field">
                  <span className="violation-element-field-label">
                    {t('shared.labels.accessibleName')}
                  </span>
                  <TruncatedText
                    className="violation-element-field-value"
                    lines={2}
                    text={violation.elementAccessibleName}
                    tooltipThreshold={100}
                  />
                </div>
              )}

              {violation.elementVisibleText && (
                <div className="violation-element-field">
                  <span className="violation-element-field-label">
                    {t('shared.labels.visibleText')}
                  </span>
                  <TruncatedText
                    className="violation-element-field-value"
                    lines={2}
                    text={violation.elementVisibleText}
                    tooltipThreshold={100}
                  />
                </div>
              )}

              {violation.elementSelector && (
                <div className="violation-element-field">
                  <span className="violation-element-field-label">
                    {t('shared.labels.selector')}
                  </span>
                  <TruncatedText
                    className="violation-element-field-value"
                    lines={2}
                    monospace
                    text={violation.elementSelector}
                    tooltipThreshold={80}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="violation-suggestion">
            <strong>{t('shared.labels.suggestion')}</strong>
            <TruncatedText
              as="p"
              className="violation-suggestion-copy"
              lines={3}
              text={violation.suggestion}
              tooltipThreshold={150}
            />
          </div>

          <div className="violation-remediation">
            <strong>{t('shared.labels.howToFix')}</strong>
            <pre>
              <TruncatedText
                as="code"
                className="violation-remediation-code"
                lines={4}
                monospace
                preserveWhitespace
                text={violation.remediationAdvice}
                tooltipThreshold={180}
              />
            </pre>
          </div>

          {violation.contrastDetails && (
            <div className="violation-contrast-helper">
              <div className="violation-contrast-helper-copy">
                <strong>{t('violations.contrastBoardTitle')}</strong>
                <p>{t('violations.contrastBoardDescription')}</p>
                <span>
                  {t('violations.contrastRatio')}:{' '}
                  {(persistedContrastRatio ?? violation.contrastDetails.measuredRatio).toFixed(2)}:1
                  {' · '}
                  {t('violations.contrastMinimum')}:{' '}
                  {violation.contrastDetails.minimumRatio.toFixed(1)}:1
                </span>
                {violation.userContrastOverride && (
                  <Tag color="blue">{t('violations.contrastUserOverrideSaved')}</Tag>
                )}
              </div>
              <Button
                icon={<BgColorsOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  setIsContrastModalOpen(true)
                }}
              >
                {t('violations.contrastBoard')}
              </Button>
            </div>
          )}

          <Space className="violation-actions">
            {violation.contrastDetails && (
              <Tooltip title={t('violations.contrastBoard')}>
                <Button
                  type="text"
                  size="small"
                  icon={<BgColorsOutlined />}
                  onClick={(event) => {
                    event.stopPropagation()
                    setIsContrastModalOpen(true)
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title={t('violations.notesTooltip')}>
              <Button
                type={violation.userNote ? 'default' : 'text'}
                size="small"
                icon={<FileTextOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  setIsNotesOpen((current) => !current)
                }}
              />
            </Tooltip>
            <Tooltip title={t('violations.copySelector')}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={(event) => {
                  event.stopPropagation()
                  navigator.clipboard.writeText(violation.elementSelector || violation.snippet)
                }}
              />
            </Tooltip>
            <Tooltip title={t('violations.goToElement')}>
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                disabled={!onSelectViolation}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectViolation?.(violation)
                }}
              />
            </Tooltip>
            <span className="violation-wcag-level">
              <InfoCircleOutlined /> {getNormativeTypeLabel(violation)} ·{' '}
              {getSeverityLabel(violation.severity)}
            </span>
            <span className="violation-review-state">
              <SearchOutlined /> {getReviewLabel(violation)}
            </span>
          </Space>

          {isNotesOpen && (
            <div className="violation-notes-card" onClick={(event) => event.stopPropagation()}>
              <div className="violation-notes-header">
                <strong>{t('shared.labels.annotations')}</strong>
                <span>{t('violations.notesLength', { count: noteDraft.length })}</span>
              </div>

              <Space className="violation-notes-toolbar" wrap>
                <Tooltip title={t('violations.insertBold')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<BoldOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      insertAtEnd('**texto**')
                    }}
                  />
                </Tooltip>
                <Tooltip title={t('violations.insertItalic')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ItalicOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      insertAtEnd('*texto*')
                    }}
                  />
                </Tooltip>
                <Tooltip title={t('violations.insertList')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<UnorderedListOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      insertAtEnd('- item')
                    }}
                  />
                </Tooltip>
                <Tooltip title={t('violations.clearDraft')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      setNoteDraft('')
                    }}
                  />
                </Tooltip>
                <Tooltip title={t('violations.saveNote')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<SaveOutlined />}
                    onClick={handleSaveNote}
                  />
                </Tooltip>
              </Space>

              <TextArea
                rows={4}
                maxLength={600}
                placeholder={t('violations.notePlaceholder')}
                value={noteDraft}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setNoteDraft(event.target.value)}
              />

              {violation.noteUpdatedAt && (
                <span className="violation-notes-meta">
                  {t('violations.noteUpdatedAt', {
                    date: new Date(violation.noteUpdatedAt).toLocaleString('pt-BR'),
                  })}
                </span>
              )}
            </div>
          )}

          {violation.contrastDetails && (
            <Modal
              open={isContrastModalOpen}
              title={t('violations.contrastBoardTitle')}
              footer={null}
              onCancel={() => setIsContrastModalOpen(false)}
              width={400}
              className="contrast-board-modal"
              destroyOnHidden
              centered
            >
              <div className="contrast-board">
                <p className="contrast-board-description">
                  {t('violations.contrastBoardDescription')}
                </p>

                <div className="contrast-board-grid">
                  <label className="contrast-board-field">
                    <span>
                      {violation.contrastDetails.foregroundLabel || t('contrast.foreground.text')}
                    </span>
                    <div className="contrast-board-picker-row">
                      <ColorPicker
                        value={foregroundHex}
                        onChange={(value) => setForegroundHex(value.toHexString())}
                      />
                      <code>{foregroundHex}</code>
                    </div>
                  </label>

                  <label className="contrast-board-field">
                    <span>
                      {violation.contrastDetails.backgroundLabel ||
                        t('contrast.background.surface')}
                    </span>
                    <div className="contrast-board-picker-row">
                      <ColorPicker
                        value={backgroundHex}
                        onChange={(value) => setBackgroundHex(value.toHexString())}
                      />
                      <code>{backgroundHex}</code>
                    </div>
                  </label>
                </div>

                <div className="contrast-board-metrics">
                  <div className="contrast-board-metric">
                    <span>{t('violations.contrastRatio')}</span>
                    <strong>{contrastRatio?.toFixed(2)}:1</strong>
                  </div>
                  <div className="contrast-board-metric">
                    <span>{t('violations.contrastMinimum')}</span>
                    <strong>{violation.contrastDetails.minimumRatio.toFixed(1)}:1</strong>
                  </div>
                  <Tag color={contrastPasses ? 'green' : 'red'}>
                    {contrastPasses
                      ? t('violations.contrastCurrentStatusPass')
                      : t('violations.contrastCurrentStatusFail')}
                  </Tag>
                </div>

                <div className="contrast-board-preview-wrap">
                  <span className="contrast-board-preview-label">
                    {t('violations.contrastPreview')}
                  </span>
                  <div
                    className={`contrast-board-preview is-${violation.contrastDetails.context}`}
                    style={{
                      backgroundColor: backgroundHex,
                      color: foregroundHex,
                      borderColor: foregroundHex,
                    }}
                  >
                    <span>{getContrastPreviewText(violation.contrastDetails.context)}</span>
                  </div>
                </div>

                {violation.contrastDetails.comparisonHex && (
                  <div className="contrast-board-comparison">
                    <span>{t('violations.contrastComparison')}</span>
                    <div className="contrast-board-comparison-row">
                      <div
                        className="contrast-board-comparison-swatch"
                        style={{ backgroundColor: violation.contrastDetails.comparisonHex }}
                      />
                      <strong>
                        {violation.contrastDetails.comparisonLabel ||
                          t('contrast.background.adjacent')}
                      </strong>
                      <code>{violation.contrastDetails.comparisonHex}</code>
                    </div>
                  </div>
                )}

                <div className="contrast-board-actions">
                  <div className="contrast-board-actions-copy">
                    {violation.userContrastOverride ? (
                      <span>
                        {t('violations.contrastSavedAt', {
                          date: new Date(violation.userContrastOverride.updatedAt).toLocaleString(
                            'pt-BR',
                          ),
                        })}
                      </span>
                    ) : (
                      <span>{t('violations.contrastOriginalPageValues')}</span>
                    )}
                  </div>
                  <Space wrap>
                    <Tooltip title={t('violations.contrastResetTooltip')}>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleClearContrastOverride()
                        }}
                      >
                        {t('violations.contrastReset')}
                      </Button>
                    </Tooltip>
                    <Tooltip title={t('violations.contrastSaveCorrectionTooltip')}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        disabled={!hasUnsavedContrastChanges}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleSaveContrastOverride()
                        }}
                      >
                        {t('violations.contrastSaveCorrection')}
                      </Button>
                    </Tooltip>
                  </Space>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </Card>
    )
  },
)

export const ViolationsList: React.FC<ViolationsListProps> = React.memo(
  ({
    violations,
    onSelectViolation,
    onHumanReviewStatusChange,
    onViolationNoteChange,
    onViolationContrastOverrideChange,
  }) => {
    const [selectedCategory, setSelectedCategory] = React.useState<'all' | RuleTopicCategory>('all')
    const sortedViolations = React.useMemo(() => sortViolations(violations), [violations])
    const visibleViolations = React.useMemo(
      () => sortedViolations.filter(isVisibleInMainLists),
      [sortedViolations],
    )
    const requirementViolations = React.useMemo(
      () => visibleViolations.filter((violation) => isNormativeRequirement(violation.nbrReference)),
      [visibleViolations],
    )
    const recommendationViolations = React.useMemo(
      () =>
        visibleViolations.filter((violation) => !isNormativeRequirement(violation.nbrReference)),
      [visibleViolations],
    )
    const reviewViolations = React.useMemo(
      () => sortedViolations.filter((violation) => violation.requiresHumanReview),
      [sortedViolations],
    )
    const availableCategories = React.useMemo(() => {
      const categories = new Set<RuleTopicCategory>()
      sortedViolations.forEach((violation) => {
        categories.add(getRuleTopicCategory(violation.ruleId))
      })
      return Array.from(categories).sort((left, right) =>
        getRuleTopicLabel(left).localeCompare(getRuleTopicLabel(right), 'pt-BR'),
      )
    }, [sortedViolations])

    const filterByCategory = React.useCallback(
      (inputViolations: Violation[]) =>
        selectedCategory === 'all'
          ? inputViolations
          : inputViolations.filter(
              (violation) => getRuleTopicCategory(violation.ruleId) === selectedCategory,
            ),
      [selectedCategory],
    )

    const filteredRequirementViolations = React.useMemo(
      () => filterByCategory(requirementViolations),
      [filterByCategory, requirementViolations],
    )
    const filteredRecommendationViolations = React.useMemo(
      () => filterByCategory(recommendationViolations),
      [filterByCategory, recommendationViolations],
    )
    const filteredReviewViolations = React.useMemo(
      () => filterByCategory(reviewViolations),
      [filterByCategory, reviewViolations],
    )

    if (!violations || violations.length === 0) {
      return <Empty description={t('violations.emptyAll')} />
    }

    return (
      <div className="violations-list">
        <div className="violations-toolbar">
          <div className="violations-toolbar-copy">
            <strong>{t('violations.categoryFilterLabel')}</strong>
            <span>{t('violations.categoryFilterDescription')}</span>
          </div>
          <Select
            className="violations-category-select"
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
            options={[
              { value: 'all', label: t('violations.categoryAll') },
              ...availableCategories.map((category) => ({
                value: category,
                label: getRuleTopicLabel(category),
              })),
            ]}
          />
        </div>
        <Tabs
          className="violations-filter-tabs"
          items={[
            {
              key: 'requirements',
              label: t('violations.tabRequirements', {
                count: filteredRequirementViolations.length,
              }),
              children: renderViolationGroups(
                filteredRequirementViolations,
                onSelectViolation,
                onHumanReviewStatusChange,
                onViolationNoteChange,
                onViolationContrastOverrideChange,
              ),
            },
            {
              key: 'recommendations',
              label: t('violations.tabRecommendations', {
                count: filteredRecommendationViolations.length,
              }),
              children: renderViolationGroups(
                filteredRecommendationViolations,
                onSelectViolation,
                onHumanReviewStatusChange,
                onViolationNoteChange,
                onViolationContrastOverrideChange,
              ),
            },
            {
              key: 'review',
              label: t('violations.tabReview', { count: filteredReviewViolations.length }),
              children: renderReviewSections(
                filteredReviewViolations,
                onSelectViolation,
                onHumanReviewStatusChange,
                onViolationNoteChange,
                onViolationContrastOverrideChange,
              ),
            },
          ]}
        />
      </div>
    )
  },
)
