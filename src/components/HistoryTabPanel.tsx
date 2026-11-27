import React from 'react'
import { Button, Dropdown, Empty, List, Tag } from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { t } from '@/i18n'
import type { AuditHistoryEntry } from '@/types'
import {
  type AuditComparisonSummary,
  getConfirmedFindingCount,
  getIgnoredFindingCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison'
import { AuditComparisonCard, type ComparisonTrend } from './AuditComparisonCard'

interface HistoryTabPanelProps {
  activeTabTitle?: string
  auditHistory: AuditHistoryEntry[]
  siteAuditHistory: AuditHistoryEntry[]
  auditResultId?: string
  selectedHistoryId: string | null
  comparisonEntries: AuditHistoryEntry[]
  comparisonBaselineId?: string
  comparisonTargetId?: string
  comparisonSummary: AuditComparisonSummary | null
  comparisonTrend: ComparisonTrend | null
  onSelectHistory: (historyId: string | null) => void
  onDeleteHistoryEntry: (entry: AuditHistoryEntry) => void
  onComparisonBaselineChange: (historyId: string) => void
  onComparisonTargetChange: (historyId: string) => void
  onExportMarkdown: () => void
  onExportJson: () => void
  onExportCsv: () => void
  onExportHistoryJson: (entry: AuditHistoryEntry) => void
  onExportHistoryCsv: (entry: AuditHistoryEntry) => void
  onExportHistorySummary: (entry: AuditHistoryEntry) => void
  onImportJson: () => void
}

function getEntryPathLabel(url: string): string {
  return new URL(url).pathname || '/'
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
  onExportHistoryJson,
  onExportHistoryCsv,
  onExportHistorySummary,
  showCurrentMarkers = true,
  showEntryUrl = false,
}: {
  entries: AuditHistoryEntry[]
  sectionTitle: string
  emptyDescription: string
  activeTabTitle?: string
  auditHistory: AuditHistoryEntry[]
  auditResultId?: string
  selectedHistoryId: string | null
  onSelectHistory: (historyId: string | null) => void
  onDeleteHistoryEntry: (entry: AuditHistoryEntry) => void
  onExportHistoryJson: (entry: AuditHistoryEntry) => void
  onExportHistoryCsv: (entry: AuditHistoryEntry) => void
  onExportHistorySummary: (entry: AuditHistoryEntry) => void
  showCurrentMarkers?: boolean
  showEntryUrl?: boolean
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
            const isCurrent =
              showCurrentMarkers && !selectedHistoryId
                ? entry.id === auditHistory[0]?.id
                : entry.id === selectedHistoryId
            const pendingReviews = getPendingHumanReviewCount(entry)
            const confirmedFindings = getConfirmedFindingCount(entry)
            const ignoredFindings = getIgnoredFindingCount(entry)

            return (
              <List.Item
                className={`history-item${entry.id === selectedHistoryId ? ' is-selected' : ''}${pendingReviews > 0 ? ' is-pending' : ' is-complete'}`}
                actions={[
                  <Dropdown
                    key="download"
                    trigger={['click']}
                    menu={{
                      items: [
                        { key: 'json', label: t('shared.actions.json') },
                        { key: 'csv', label: t('shared.actions.csv') },
                        { key: 'summary', label: t('shared.actions.downloadSummary') },
                      ],
                      onClick: ({ key }) => {
                        if (key === 'json') onExportHistoryJson(entry)
                        if (key === 'csv') onExportHistoryCsv(entry)
                        if (key === 'summary') onExportHistorySummary(entry)
                      },
                    }}
                  >
                    <Button
                      key="download-button"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {t('shared.actions.download')}
                    </Button>
                  </Dropdown>,
                  <Button
                    key="view"
                    type={entry.id === selectedHistoryId ? 'primary' : 'default'}
                    size="small"
                    icon={<HistoryOutlined />}
                    disabled={
                      showCurrentMarkers && entry.id === selectedHistoryId && !auditResultId
                    }
                    onClick={() =>
                      onSelectHistory(entry.id === selectedHistoryId ? null : entry.id)
                    }
                  >
                    {entry.id === selectedHistoryId
                      ? auditResultId
                        ? t('shared.actions.viewCurrent')
                        : t('shared.actions.usingHistory')
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
                  title={
                    <div className="history-item-title">
                      <span>{entry.pageTitle || activeTabTitle || entry.url}</span>
                      {showEntryUrl && <Tag>{getEntryPathLabel(entry.url)}</Tag>}
                      {showCurrentMarkers &&
                        !selectedHistoryId &&
                        entry.id === auditHistory[0]?.id && (
                          <Tag color="blue">{t('shared.states.moreRecent')}</Tag>
                        )}
                      {entry.id === selectedHistoryId && (
                        <Tag color="gold">{t('shared.states.currentlyViewing')}</Tag>
                      )}
                      {isCurrent && selectedHistoryId && (
                        <Tag color="blue">{t('shared.states.currentInFocus')}</Tag>
                      )}
                      {entry.importedAt && <Tag>{t('shared.states.imported')}</Tag>}
                      <Tag color={pendingReviews > 0 ? 'gold' : 'green'}>
                        {pendingReviews > 0
                          ? t('shared.states.reviewPending')
                          : t('shared.states.reviewComplete')}
                      </Tag>
                      <Tag color={entry.includeRecommendations ? 'blue' : 'default'}>
                        {entry.includeRecommendations
                          ? t('popup.scope.withRecommendations')
                          : t('popup.scope.requirementsOnly')}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="history-item-meta">
                      <div className="history-item-meta-row">
                        <span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                        <span>{t('shared.counts.items', { count: entry.totalViolations })}</span>
                      </div>
                      {showEntryUrl && <span className="history-item-url">{entry.url}</span>}
                      <div className="history-item-tag-row">
                        <Tag color="red">
                          {t('shared.counts.confirmed', { count: confirmedFindings })}
                        </Tag>
                        <Tag>{t('shared.counts.ignored', { count: ignoredFindings })}</Tag>
                        <Tag color="gold">
                          {t('shared.counts.pending', { count: pendingReviews })}
                        </Tag>
                        <Tag color="blue">
                          {t('shared.counts.annotations', {
                            count: entry.violations.filter((violation) =>
                              Boolean(violation.userNote?.trim()),
                            ).length,
                          })}
                        </Tag>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )
}

export const HistoryTabPanel: React.FC<HistoryTabPanelProps> = React.memo(
  ({
    activeTabTitle,
    auditHistory,
    siteAuditHistory,
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
    onExportHistoryJson,
    onExportHistoryCsv,
    onExportHistorySummary,
    onImportJson,
  }) => {
    const pendingHistoryEntries = React.useMemo(
      () => auditHistory.filter((entry) => getPendingHumanReviewCount(entry) > 0),
      [auditHistory],
    )
    const completedHistoryEntries = React.useMemo(
      () => auditHistory.filter((entry) => getPendingHumanReviewCount(entry) === 0),
      [auditHistory],
    )

    return (
      <div className="history-tab">
        <div className="history-toolbar">
          <div>
            <strong>{t('popup.history.importTitle')}</strong>
            <p>{t('popup.history.importDescription')}</p>
          </div>
          <Button icon={<UploadOutlined />} onClick={onImportJson}>
            {t('shared.actions.importJson')}
          </Button>
        </div>

        {comparisonEntries.length >= 2 && (
          <AuditComparisonCard
            entries={comparisonEntries}
            baselineId={comparisonBaselineId}
            targetId={comparisonTargetId}
            summary={comparisonSummary}
            trend={comparisonTrend}
            onBaselineChange={onComparisonBaselineChange}
            onTargetChange={onComparisonTargetChange}
            onExportMarkdown={onExportMarkdown}
            onExportJson={onExportJson}
            onExportCsv={onExportCsv}
          />
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
              onExportHistoryJson={onExportHistoryJson}
              onExportHistoryCsv={onExportHistoryCsv}
              onExportHistorySummary={onExportHistorySummary}
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
              onExportHistoryJson={onExportHistoryJson}
              onExportHistoryCsv={onExportHistoryCsv}
              onExportHistorySummary={onExportHistorySummary}
            />
          </>
        )}

        {siteAuditHistory.length > 0 && (
          <HistoryListSection
            entries={siteAuditHistory}
            sectionTitle={t('popup.history.otherPagesTitle')}
            emptyDescription={t('popup.history.otherPagesEmpty')}
            activeTabTitle={activeTabTitle}
            auditHistory={auditHistory}
            auditResultId={auditResultId}
            selectedHistoryId={selectedHistoryId}
            onSelectHistory={onSelectHistory}
            onDeleteHistoryEntry={onDeleteHistoryEntry}
            onExportHistoryJson={onExportHistoryJson}
            onExportHistoryCsv={onExportHistoryCsv}
            onExportHistorySummary={onExportHistorySummary}
            showCurrentMarkers={false}
            showEntryUrl
          />
        )}
      </div>
    )
  },
)
