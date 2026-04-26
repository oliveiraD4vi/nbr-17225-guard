import React from 'react';
import { Alert, Button, Empty, List, Select, Space, Statistic, Tag } from 'antd';
import { DeleteOutlined, DownloadOutlined, FileSearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { t } from '@/i18n';
import type { AuditHistoryEntry } from '@/types';
import {
  type AuditComparisonSummary,
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison';

interface ComparisonTrend {
  icon: React.ReactNode;
  label: string;
  color: 'green' | 'red' | 'default';
}

interface HistoryTabPanelProps {
  activeTabTitle?: string;
  auditHistory: AuditHistoryEntry[];
  auditResultId?: string;
  selectedHistoryId: string | null;
  comparisonEntries: AuditHistoryEntry[];
  comparisonBaselineId?: string;
  comparisonTargetId?: string;
  comparisonSummary: AuditComparisonSummary | null;
  comparisonTrend: ComparisonTrend | null;
  onSelectHistory: (historyId: string | null) => void;
  onDeleteHistoryEntry: (entry: AuditHistoryEntry) => void;
  onComparisonBaselineChange: (historyId: string) => void;
  onComparisonTargetChange: (historyId: string) => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

function getHistoryOptionLabel(entry: AuditHistoryEntry): string {
  return t('popup.history.optionLabel', {
    date: new Date(entry.timestamp).toLocaleString('pt-BR'),
    count: entry.totalViolations,
  });
}

function HistoryListSection({
  entries,
  sectionTitle,
  emptyDescription,
  activeTabTitle,
  auditHistory,
  auditResultId,
  selectedHistoryId,
  onSelectHistory,
  onDeleteHistoryEntry,
}: {
  entries: AuditHistoryEntry[];
  sectionTitle: string;
  emptyDescription: string;
  activeTabTitle?: string;
  auditHistory: AuditHistoryEntry[];
  auditResultId?: string;
  selectedHistoryId: string | null;
  onSelectHistory: (historyId: string | null) => void;
  onDeleteHistoryEntry: (entry: AuditHistoryEntry) => void;
}) {
  return (
    <div className="history-section">
      <div className="history-section-header">
        <strong>{sectionTitle}</strong>
        <span>{t('shared.counts.audits', { count: entries.length })}</span>
      </div>
      {entries.length === 0 ? (
        <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={entries}
          renderItem={(entry) => {
            const isCurrent = !selectedHistoryId ? entry.id === auditHistory[0]?.id : entry.id === selectedHistoryId;
            const pendingReviews = getPendingHumanReviewCount(entry);
            const confirmedReviews = getConfirmedHumanReviewCount(entry);
            const dismissedReviews = getDismissedHumanReviewCount(entry);

            return (
              <List.Item
                className={`history-item${entry.id === selectedHistoryId ? ' is-selected' : ''}${pendingReviews > 0 ? ' is-pending' : ' is-complete'}`}
                actions={[
                  <Button
                    key="view"
                    type={entry.id === selectedHistoryId ? 'primary' : 'default'}
                    size="small"
                    icon={<HistoryOutlined />}
                    disabled={entry.id === selectedHistoryId && !auditResultId}
                    onClick={() => onSelectHistory(entry.id === selectedHistoryId ? null : entry.id)}
                  >
                    {entry.id === selectedHistoryId
                      ? (auditResultId ? t('shared.actions.viewCurrent') : t('shared.actions.usingHistory'))
                      : t('shared.actions.view')}
                  </Button>,
                  <Button
                    key="delete"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteHistoryEntry(entry)}
                  >
                    {t('shared.actions.delete')}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileSearchOutlined />}
                  title={(
                    <div className="history-item-title">
                      <span>{entry.pageTitle || activeTabTitle || entry.url}</span>
                      {!selectedHistoryId && entry.id === auditHistory[0]?.id && (
                        <Tag color="blue">{t('shared.states.moreRecent')}</Tag>
                      )}
                      {entry.id === selectedHistoryId && (
                        <Tag color="gold">{t('shared.states.currentlyViewing')}</Tag>
                      )}
                      {isCurrent && selectedHistoryId && (
                        <Tag color="blue">{t('shared.states.currentInFocus')}</Tag>
                      )}
                      <Tag color={pendingReviews > 0 ? 'gold' : 'green'}>
                        {pendingReviews > 0 ? t('shared.states.reviewPending') : t('shared.states.reviewComplete')}
                      </Tag>
                      <Tag color={entry.includeRecommendations ? 'blue' : 'default'}>
                        {entry.includeRecommendations
                          ? t('popup.scope.withRecommendations')
                          : t('popup.scope.requirementsOnly')}
                      </Tag>
                    </div>
                  )}
                  description={(
                    <div className="history-item-meta">
                      <div className="history-item-meta-row">
                        <span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                        <span>{t('shared.counts.items', { count: entry.totalViolations })}</span>
                      </div>
                      <div className="history-item-tag-row">
                        <Tag color="red">{t('shared.counts.confirmed', { count: confirmedReviews })}</Tag>
                        <Tag>{t('shared.counts.dismissed', { count: dismissedReviews })}</Tag>
                        <Tag color="gold">{t('shared.counts.pending', { count: pendingReviews })}</Tag>
                        <Tag color="blue">
                          {t('shared.counts.annotations', {
                            count: entry.violations.filter((violation) => Boolean(violation.userNote?.trim())).length,
                          })}
                        </Tag>
                      </div>
                    </div>
                  )}
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}

export const HistoryTabPanel: React.FC<HistoryTabPanelProps> = React.memo(({
  activeTabTitle,
  auditHistory,
  auditResultId,
  selectedHistoryId,
  comparisonEntries,
  comparisonBaselineId,
  comparisonTargetId,
  comparisonSummary,
  comparisonTrend,
  onSelectHistory,
  onDeleteHistoryEntry,
  onComparisonBaselineChange,
  onComparisonTargetChange,
  onExportMarkdown,
  onExportJson,
  onExportCsv,
}) => {
  const pendingHistoryEntries = React.useMemo(
    () => auditHistory.filter((entry) => getPendingHumanReviewCount(entry) > 0),
    [auditHistory],
  );
  const completedHistoryEntries = React.useMemo(
    () => auditHistory.filter((entry) => getPendingHumanReviewCount(entry) === 0),
    [auditHistory],
  );

  return (
    <div className="history-tab">
      {comparisonEntries.length >= 2 && (
        <div className="history-comparison-card">
          <div className="history-comparison-header">
            <div>
              <strong>{t('popup.history.comparisonTitle')}</strong>
              <p>{t('popup.history.comparisonDescription')}</p>
            </div>
            <Space>
              {comparisonTrend && (
                <Tag color={comparisonTrend.color}>
                  {comparisonTrend.icon} {comparisonTrend.label}
                </Tag>
              )}
              <Button size="small" icon={<DownloadOutlined />} onClick={onExportMarkdown} disabled={!comparisonSummary}>
                {t('shared.actions.exportMarkdown')}
              </Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={onExportJson} disabled={!comparisonSummary}>
                {t('shared.actions.json')}
              </Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={onExportCsv} disabled={!comparisonSummary}>
                {t('shared.actions.csv')}
              </Button>
            </Space>
          </div>

          <div className="history-comparison-selectors">
            <div className="history-comparison-field">
              <span>{t('shared.labels.base')}</span>
              <Select
                value={comparisonBaselineId}
                onChange={onComparisonBaselineChange}
                options={comparisonEntries.map((entry) => ({
                  value: entry.id,
                  label: getHistoryOptionLabel(entry),
                }))}
              />
            </div>
            <div className="history-comparison-field">
              <span>{t('shared.labels.compareWith')}</span>
              <Select
                value={comparisonTargetId}
                onChange={onComparisonTargetChange}
                options={comparisonEntries.map((entry) => ({
                  value: entry.id,
                  label: getHistoryOptionLabel(entry),
                }))}
              />
            </div>
          </div>

          {comparisonSummary ? (
            <div className="history-comparison-body">
              <div className="history-comparison-stats">
                <Statistic title={t('popup.history.newProblems')} value={comparisonSummary.newViolations.length} />
                <Statistic title={t('popup.history.resolvedProblems')} value={comparisonSummary.resolvedViolations.length} />
                <Statistic title={t('popup.history.persistentProblems')} value={comparisonSummary.persistentViolations.length} />
              </div>

              <div className="history-comparison-meta">
                <span>{t('popup.history.metadataNotes', { from: comparisonSummary.baselineNoteCount, to: comparisonSummary.targetNoteCount })}</span>
                <span>{t('popup.history.metadataConfirmed', { from: comparisonSummary.baselineConfirmedReviews, to: comparisonSummary.targetConfirmedReviews })}</span>
                <span>{t('popup.history.metadataDismissed', { from: comparisonSummary.baselineDismissedReviews, to: comparisonSummary.targetDismissedReviews })}</span>
                <span>{t('popup.history.metadataPending', { from: comparisonSummary.baselinePendingReviews, to: comparisonSummary.targetPendingReviews })}</span>
                <span>{t('popup.history.metadataVisible', { from: comparisonSummary.baselineOpenCount, to: comparisonSummary.targetOpenCount })}</span>
                <span>{t('popup.history.metadataDelta', { value: comparisonSummary.openIssuesDeltaPercentage })}</span>
              </div>
            </div>
          ) : (
            <Alert
              type="info"
              showIcon
              message={t('popup.messages.comparisonSelectInfo')}
            />
          )}
        </div>
      )}

      {auditHistory.length === 0 ? (
        <Empty description={t('popup.history.emptyCurrentUrl')} />
      ) : (
        <>
          <HistoryListSection
            entries={pendingHistoryEntries}
            sectionTitle={t('popup.history.sectionPending')}
            emptyDescription={t('popup.history.emptyPending')}
            activeTabTitle={activeTabTitle}
            auditHistory={auditHistory}
            auditResultId={auditResultId}
            selectedHistoryId={selectedHistoryId}
            onSelectHistory={onSelectHistory}
            onDeleteHistoryEntry={onDeleteHistoryEntry}
          />
          <HistoryListSection
            entries={completedHistoryEntries}
            sectionTitle={t('popup.history.sectionCompleted')}
            emptyDescription={t('popup.history.emptyCompleted')}
            activeTabTitle={activeTabTitle}
            auditHistory={auditHistory}
            auditResultId={auditResultId}
            selectedHistoryId={selectedHistoryId}
            onSelectHistory={onSelectHistory}
            onDeleteHistoryEntry={onDeleteHistoryEntry}
          />
        </>
      )}
    </div>
  );
});
