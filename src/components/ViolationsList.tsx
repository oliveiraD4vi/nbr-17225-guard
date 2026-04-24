import React from 'react';
import { Button, Card, Checkbox, Collapse, Empty, Input, Space, Tabs, Tag, Tooltip } from 'antd';
import {
  BoldOutlined,
  ClearOutlined,
  CopyOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ItalicOutlined,
  LinkOutlined,
  PushpinFilled,
  SaveOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { t } from '@/i18n';
import type { HumanReviewStatus, Violation } from '@/types';
import '../styles/violations-list.css';

interface ViolationsListProps {
  violations: Violation[];
  onSelectViolation?: (violation: Violation) => void;
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void;
  onViolationNoteChange?: (violation: Violation, note: string) => void;
}

interface ViolationGroup {
  ruleId: string;
  violations: Violation[];
  topIssueCount: number;
}

const { TextArea } = Input;

const severityRank: Record<Violation['severity'], number> = {
  error: 0,
  warning: 1,
};

function getSeverityColor(severity: Violation['severity']): string {
  return severity === 'error' ? 'red' : 'orange';
}

function getSeverityLabel(severity: Violation['severity']): string {
  return severity === 'error' ? t('shared.severity.requirement') : t('shared.severity.recommendation');
}

function getReviewLabel(violation: Violation): string {
  if (!violation.requiresHumanReview) return t('shared.states.automaticDetection');
  if (violation.humanReviewStatus === 'confirmed') return t('shared.review.confirmedNeedsFix');
  if (violation.humanReviewStatus === 'dismissed') return t('shared.review.dismissed');
  return t('shared.review.needsConfirmation');
}

function isVisibleInMainLists(violation: Violation): boolean {
  return !(violation.requiresHumanReview && violation.humanReviewStatus === 'dismissed');
}

function getViolationSignature(violation: Violation): string {
  return `${violation.message}|${violation.elementSelector || violation.snippet}`;
}

function sortViolations(violations: Violation[]): Violation[] {
  return [...violations].sort((left, right) => {
    const severityCompare = severityRank[left.severity] - severityRank[right.severity];
    if (severityCompare !== 0) return severityCompare;

    const leftSelector = left.elementSelector || '';
    const rightSelector = right.elementSelector || '';
    return leftSelector.localeCompare(rightSelector, 'pt-BR');
  });
}

function buildGroups(violations: Violation[]): ViolationGroup[] {
  const groupedByRule = violations.reduce((acc, violation) => {
    if (!acc[violation.ruleId]) {
      acc[violation.ruleId] = [];
    }
    acc[violation.ruleId].push(violation);
    return acc;
  }, {} as Record<string, Violation[]>);

  return Object.entries(groupedByRule)
    .map(([ruleId, ruleViolations]) => ({
      ruleId,
      violations: sortViolations(ruleViolations),
      topIssueCount: new Set(ruleViolations.slice(0, 3).map(getViolationSignature)).size,
    }))
    .sort((left, right) => {
      const leftFirst = left.violations[0];
      const rightFirst = right.violations[0];
      const severityCompare = severityRank[leftFirst.severity] - severityRank[rightFirst.severity];
      if (severityCompare !== 0) return severityCompare;
      if (right.violations.length !== left.violations.length) return right.violations.length - left.violations.length;
      return leftFirst.nbrReference.localeCompare(rightFirst.nbrReference, 'pt-BR');
    });
}

function getElementTitle(violation: Violation): string {
  const tag = violation.elementTagName || 'elemento';
  const selector = violation.elementSelector || '';
  const selectorSuffix = selector.startsWith(tag) ? selector.slice(tag.length) : selector;
  return `${tag}${selectorSuffix ? ` ${selectorSuffix}` : ''}`;
}

function renderViolationGroups(
  violations: Violation[],
  onSelectViolation?: (violation: Violation) => void,
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void,
  onViolationNoteChange?: (violation: Violation, note: string) => void,
): React.ReactNode {
  if (violations.length === 0) {
    return <Empty description={t('violations.emptyCategory')} />;
  }

  const groups = buildGroups(violations);
  const topRuleIds = new Set(groups.slice(0, 3).map((group) => group.ruleId));

  const items = groups.map((group) => {
    const firstViolation = group.violations[0];
    const topIssues = group.violations.slice(0, 3);
    const remainingIssues = group.violations.slice(3);

    return {
      key: group.ruleId,
      label: (
        <div className="violation-group-header">
          <div className="violation-group-main">
            <div className="violation-group-title-row">
              <span className="violation-rule-name">{firstViolation.ruleName}</span>
              {topRuleIds.has(group.ruleId) && (
                <Tag className="violation-top-tag" color="volcano">
                  <PushpinFilled /> {t('shared.states.priority')}
                </Tag>
              )}
            </div>
            <span className="violation-group-description">{firstViolation.description}</span>
          </div>
          <div className="violation-group-meta">
            <Tag color={getSeverityColor(firstViolation.severity)}>
              {getSeverityLabel(firstViolation.severity)}
            </Tag>
            {firstViolation.requiresHumanReview && <Tag color="gold">{t('shared.states.humanConfirmation')}</Tag>}
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
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    };
  });

  return <Collapse items={items} />;
}

interface ViolationCardProps {
  violation: Violation;
  index: number;
  onSelectViolation?: (violation: Violation) => void;
  onHumanReviewStatusChange?: (violation: Violation, status: HumanReviewStatus) => void;
  onViolationNoteChange?: (violation: Violation, note: string) => void;
  pinned?: boolean;
}

const ViolationCard: React.FC<ViolationCardProps> = React.memo(({
  violation,
  index,
  onSelectViolation,
  onHumanReviewStatusChange,
  onViolationNoteChange,
  pinned = false,
}) => {
  const [isNotesOpen, setIsNotesOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState(violation.userNote || '');

  React.useEffect(() => {
    setNoteDraft(violation.userNote || '');
  }, [violation.id, violation.userNote]);

  const insertAtEnd = React.useCallback((value: string) => {
    setNoteDraft((current) => `${current}${current ? '\n' : ''}${value}`);
  }, []);

  const handleSaveNote = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onViolationNoteChange?.(violation, noteDraft.trim());
  }, [noteDraft, onViolationNoteChange, violation]);

  const handleCardClick = React.useCallback(() => {
    onSelectViolation?.(violation);
  }, [onSelectViolation, violation]);

  return (
    <Card
      size="small"
      className={`violation-item-card${pinned ? ' is-pinned' : ''}`}
      onClick={handleCardClick}
    >
      <div className="violation-item-header">
        <span className="violation-item-number">#{index + 1}</span>
        <div className="violation-item-heading">
          <span className="violation-item-message">{violation.message}</span>
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
            <Tag
              color={
                violation.humanReviewStatus === 'confirmed'
                  ? 'red'
                  : violation.humanReviewStatus === 'dismissed'
                    ? 'default'
                    : 'gold'
              }
            >
              {getReviewLabel(violation)}
            </Tag>
            <div className="violation-human-review-controls">
              <Checkbox
                checked={violation.humanReviewStatus === 'confirmed'}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onHumanReviewStatusChange?.(
                  violation,
                  event.target.checked ? 'confirmed' : 'pending',
                )}
              >
                {t('violations.checkboxProblem')}
              </Checkbox>
              <Checkbox
                checked={violation.humanReviewStatus === 'dismissed'}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onHumanReviewStatusChange?.(
                  violation,
                  event.target.checked ? 'dismissed' : 'pending',
                )}
              >
                {t('violations.checkboxNotProblem')}
              </Checkbox>
            </div>
          </div>
        )}

        <div className="violation-element-card">
          <strong>{t('shared.labels.affectedElement')}</strong>
          <div className="violation-element-title">{getElementTitle(violation)}</div>

          <div className="violation-element-fields">
            {violation.elementAccessibleName && (
              <div className="violation-element-field">
                <span className="violation-element-field-label">{t('shared.labels.accessibleName')}</span>
                <span className="violation-element-field-value">{violation.elementAccessibleName}</span>
              </div>
            )}

            {violation.elementVisibleText && (
              <div className="violation-element-field">
                <span className="violation-element-field-label">{t('shared.labels.visibleText')}</span>
                <span className="violation-element-field-value">{violation.elementVisibleText}</span>
              </div>
            )}

            {violation.elementSelector && (
              <div className="violation-element-field">
                <span className="violation-element-field-label">{t('shared.labels.selector')}</span>
                <span className="violation-element-field-value is-monospace">{violation.elementSelector}</span>
              </div>
            )}
          </div>
        </div>

        <div className="violation-suggestion">
          <strong>{t('shared.labels.suggestion')}</strong>
          <p>{violation.suggestion}</p>
        </div>

        <div className="violation-remediation">
          <strong>{t('shared.labels.howToFix')}</strong>
          <pre>
            <code>{violation.remediationAdvice}</code>
          </pre>
        </div>

        <Space className="violation-actions">
          <Tooltip title={t('violations.notesTooltip')}>
            <Button
              type={violation.userNote ? 'default' : 'text'}
              size="small"
              icon={<FileTextOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setIsNotesOpen((current) => !current);
              }}
            />
          </Tooltip>
          <Tooltip title={t('violations.copySelector')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(violation.elementSelector || violation.snippet);
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
                event.stopPropagation();
                onSelectViolation?.(violation);
              }}
            />
          </Tooltip>
          <span className="violation-wcag-level">
            <InfoCircleOutlined /> {getSeverityLabel(violation.severity)}
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
                    event.stopPropagation();
                    insertAtEnd('**texto**');
                  }}
                />
              </Tooltip>
              <Tooltip title={t('violations.insertItalic')}>
                <Button
                  type="text"
                  size="small"
                  icon={<ItalicOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    insertAtEnd('*texto*');
                  }}
                />
              </Tooltip>
              <Tooltip title={t('violations.insertList')}>
                <Button
                  type="text"
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    insertAtEnd('- item');
                  }}
                />
              </Tooltip>
              <Tooltip title={t('violations.clearDraft')}>
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setNoteDraft('');
                  }}
                />
              </Tooltip>
              <Tooltip title={t('violations.saveNote')}>
                <Button type="text" size="small" icon={<SaveOutlined />} onClick={handleSaveNote} />
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
      </div>
    </Card>
  );
});

export const ViolationsList: React.FC<ViolationsListProps> = React.memo(({
  violations,
  onSelectViolation,
  onHumanReviewStatusChange,
  onViolationNoteChange,
}) => {
  const sortedViolations = React.useMemo(() => sortViolations(violations), [violations]);
  const visibleViolations = React.useMemo(
    () => sortedViolations.filter(isVisibleInMainLists),
    [sortedViolations],
  );
  const requirementViolations = React.useMemo(
    () => visibleViolations.filter((violation) => violation.severity === 'error'),
    [visibleViolations],
  );
  const recommendationViolations = React.useMemo(
    () => visibleViolations.filter((violation) => violation.severity !== 'error'),
    [visibleViolations],
  );
  const reviewViolations = React.useMemo(
    () => sortedViolations.filter((violation) => violation.requiresHumanReview),
    [sortedViolations],
  );

  if (!violations || violations.length === 0) {
    return <Empty description={t('violations.emptyAll')} />;
  }

  return (
    <div className="violations-list">
      <Tabs
        className="violations-filter-tabs"
        items={[
          {
            key: 'all',
            label: t('violations.tabAll', { count: visibleViolations.length }),
            children: renderViolationGroups(
              visibleViolations,
              onSelectViolation,
              onHumanReviewStatusChange,
              onViolationNoteChange,
            ),
          },
          {
            key: 'requirements',
            label: t('violations.tabRequirements', { count: requirementViolations.length }),
            children: renderViolationGroups(
              requirementViolations,
              onSelectViolation,
              onHumanReviewStatusChange,
              onViolationNoteChange,
            ),
          },
          {
            key: 'recommendations',
            label: t('violations.tabRecommendations', { count: recommendationViolations.length }),
            children: renderViolationGroups(
              recommendationViolations,
              onSelectViolation,
              onHumanReviewStatusChange,
              onViolationNoteChange,
            ),
          },
          {
            key: 'review',
            label: t('violations.tabReview', { count: reviewViolations.length }),
            children: renderViolationGroups(
              reviewViolations,
              onSelectViolation,
              onHumanReviewStatusChange,
              onViolationNoteChange,
            ),
          },
        ]}
      />
    </div>
  );
});
