import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Layout, message, Modal, Space, Switch, Tabs, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FallOutlined,
  FlagOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  ReloadOutlined,
  RiseOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { PopupPanelSkeleton } from './LoadingSkeletons'
import { t } from '@/i18n'
import { isNormativeRequirement } from '@/normative'
import type {
  AuditHistoryEntry,
  AuditResult,
  HumanReviewStatus,
  Violation,
  VisionSimulationFilter,
} from '@/types'
import { compareAuditResults } from '@/utils/audit-comparison'
import { buildAuditSummaryMarkdown, buildExportableAuditResult } from '@/utils/audit-export'
import {
  clearAuditHistoryForUrl,
  compactAuditStorage,
  deleteOldestAuditHistoryEntry,
  deleteAuditHistoryEntry,
  ensureContentScriptReady,
  getDisplayResultForScope,
  getActiveTab,
  getAuditHistoryForUrl,
  getAuditResult,
  importAuditReportToHistory,
  isAuditStorageQuotaError,
  parseImportedAuditReport,
  resetAuditCache,
  runAccessibilityAudit,
  saveAuditResult,
  updateStoredAuditResult,
} from '@/utils/audit-engine'
import '../styles/popup.css'

const { Header, Content, Footer } = Layout

const ViolationsSummary = React.lazy(async () => {
  const module = await import('./ViolationsSummary')
  return { default: module.ViolationsSummary }
})

const ViolationsList = React.lazy(async () => {
  const module = await import('./ViolationsList')
  return { default: module.ViolationsList }
})

const VisionSimulator = React.lazy(async () => {
  const module = await import('./VisionSimulator')
  return { default: module.VisionSimulator }
})

const AboutPanel = React.lazy(async () => {
  const module = await import('./AboutPanel')
  return { default: module.AboutPanel }
})

const HistoryTabPanel = React.lazy(async () => {
  const module = await import('./HistoryTabPanel')
  return { default: module.HistoryTabPanel }
})

const severityRank: Record<Violation['severity'], number> = {
  error: 0,
  warning: 1,
}

const maxHeaderTabTitleLength = 300

function truncateHeaderTabTitle(value: string): string {
  if (value.length <= maxHeaderTabTitleLength) return value
  return `${value.slice(0, maxHeaderTabTitleLength - 3).trimEnd()}...`
}

function getPriorityViolations(violations: Violation[]): Violation[] {
  const seenRules = new Set<string>()

  return [...violations]
    .sort((left, right) => {
      const severityCompare = severityRank[left.severity] - severityRank[right.severity]
      if (severityCompare !== 0) return severityCompare
      return left.nbrReference.localeCompare(right.nbrReference, 'pt-BR')
    })
    .filter((violation) => {
      if (seenRules.has(violation.ruleId)) return false
      seenRules.add(violation.ruleId)
      return true
    })
    .slice(0, 3)
}

function getComparisonTrend(summary: ReturnType<typeof compareAuditResults> | null) {
  if (!summary) return null

  const delta = summary.targetOpenCount - summary.baselineOpenCount
  if (delta < 0) {
    return {
      icon: <RiseOutlined />,
      label: t('shared.states.improvement'),
      color: 'green' as const,
    }
  }
  if (delta > 0) {
    return {
      icon: <FallOutlined />,
      label: t('shared.states.regression'),
      color: 'red' as const,
    }
  }

  return {
    icon: <MinusOutlined />,
    label: t('shared.states.stable'),
    color: 'default' as const,
  }
}

function getComparisonQuickReadingLabel(label: string): string {
  if (label === t('shared.states.improvement')) return t('popup.history.quickReadingImprovement')
  if (label === t('shared.states.regression')) return t('popup.history.quickReadingRegression')
  return t('popup.history.quickReadingStable')
}

function getQuotaAlertDescriptionKey(
  scope: 'audit' | 'history' | 'review',
  hasUnsavedChanges: boolean,
): string {
  if (!hasUnsavedChanges) return 'popup.quota.alertDescription'

  if (scope === 'audit') return 'popup.quota.alertDescriptionUnsavedAudit'
  if (scope === 'history') return 'popup.quota.alertDescriptionUnsavedHistory'
  return 'popup.quota.alertDescriptionUnsavedReview'
}

function getQuotaModalAlertDescriptionKey(scope: 'audit' | 'history' | 'review'): string {
  if (scope === 'audit') return 'popup.quota.modalAlertDescriptionAudit'
  if (scope === 'history') return 'popup.quota.modalAlertDescriptionHistory'
  return 'popup.quota.modalAlertDescriptionReview'
}

export const PopupApp: React.FC = () => {
  const quotaRetryRef = useRef<(() => Promise<unknown>) | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [includeRecommendations, setIncludeRecommendations] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<(chrome.tabs.Tab & { id: number }) | null>(null)
  const [activeTabKey, setActiveTabKey] = useState('summary')
  const [priorityIndex, setPriorityIndex] = useState(0)
  const [showAboutView, setShowAboutView] = useState(false)
  const [historyEntryPendingDeletion, setHistoryEntryPendingDeletion] =
    useState<AuditHistoryEntry | null>(null)
  const [comparisonBaselineId, setComparisonBaselineId] = useState<string | undefined>(undefined)
  const [comparisonTargetId, setComparisonTargetId] = useState<string | undefined>(undefined)
  const [quotaIssue, setQuotaIssue] = useState<{
    url: string
    scope: 'audit' | 'history' | 'review'
    hasUnsavedChanges: boolean
  } | null>(null)
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false)
  const [quotaRecoveryLoading, setQuotaRecoveryLoading] = useState(false)
  const appIconUrl = useMemo(() => chrome.runtime.getURL('icons/icon-white.png'), [])

  const syncAuditResultUpdate = useCallback((updatedResult: AuditResult) => {
    setAuditHistory((currentHistory) =>
      currentHistory.map((entry) =>
        entry.id === updatedResult.id ? (updatedResult as AuditHistoryEntry) : entry,
      ),
    )
    setAuditResult((currentResult) =>
      currentResult?.id === updatedResult.id ? updatedResult : currentResult,
    )
  }, [])

  const loadAuditForCurrentTab = useCallback(async () => {
    try {
      const tab = await getActiveTab()
      setActiveTab(tab)
      const [result, preferences] = await Promise.all([
        getAuditResult(tab.id),
        chrome.storage.local.get('includeRecommendationsPreference'),
      ])
      const history = await getAuditHistoryForUrl(tab.url)
      const resolvedPreference =
        result?.includeRecommendations ?? Boolean(preferences.includeRecommendationsPreference)
      setAuditResult(result)
      setAuditHistory(history)
      setIncludeRecommendations(resolvedPreference)
      setSelectedHistoryId(!result && history.length > 0 ? history[0].id : null)
      setShowAboutView(false)
      setPriorityIndex(0)
      setComparisonTargetId(history[0]?.id)
      setComparisonBaselineId(history[1]?.id || history[0]?.id)
    } catch (error) {
      console.error('Erro ao carregar resultado da aba ativa:', error)
      setAuditResult(null)
      setAuditHistory([])
      setSelectedHistoryId(null)
      setShowAboutView(false)
      setPriorityIndex(0)
      setComparisonBaselineId(undefined)
      setComparisonTargetId(undefined)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  const persistWithQuotaHandling = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      issue: {
        url: string
        scope: 'audit' | 'history' | 'review'
        hasUnsavedChanges: boolean
      },
    ): Promise<T | null> => {
      try {
        const result = await operation()
        setQuotaIssue(null)
        setIsQuotaModalOpen(false)
        quotaRetryRef.current = null
        return result
      } catch (error) {
        if (isAuditStorageQuotaError(error)) {
          quotaRetryRef.current = operation
          setQuotaIssue(issue)
          setIsQuotaModalOpen(true)
          return null
        }

        throw error
      }
    },
    [],
  )

  useEffect(() => {
    void loadAuditForCurrentTab()

    const handleTabActivated = () => {
      void loadAuditForCurrentTab()
    }

    const handleTabUpdated = (tabId: number, changeInfo: { status?: string; url?: string }) => {
      if (!activeTab?.id || tabId !== activeTab.id) return
      if (changeInfo.status === 'complete' || 'url' in changeInfo) {
        void loadAuditForCurrentTab()
      }
    }

    chrome.tabs.onActivated.addListener(handleTabActivated)
    chrome.tabs.onUpdated.addListener(handleTabUpdated)

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated)
      chrome.tabs.onUpdated.removeListener(handleTabUpdated)
    }
  }, [activeTab?.id, loadAuditForCurrentTab])

  const sendMessageToActiveTab = useCallback(
    async (payload: Record<string, unknown>) => {
      const tab = activeTab ?? (await getActiveTab())
      await ensureContentScriptReady(tab.id)
      await chrome.tabs.sendMessage(tab.id, payload)
    },
    [activeTab],
  )

  const viewedAuditResult = useMemo(() => {
    if (!selectedHistoryId) return auditResult
    return auditHistory.find((entry) => entry.id === selectedHistoryId) || auditResult
  }, [auditHistory, auditResult, selectedHistoryId])

  const isHistoricalView = Boolean(selectedHistoryId)
  const displayedAuditResult = useMemo(
    () => getDisplayResultForScope(viewedAuditResult, includeRecommendations),
    [includeRecommendations, viewedAuditResult],
  )
  const scopedRawViolations = useMemo(
    () =>
      viewedAuditResult?.violations.filter(
        (violation) => includeRecommendations || isNormativeRequirement(violation.nbrReference),
      ) ?? [],
    [includeRecommendations, viewedAuditResult],
  )
  const reviewSourceResult = useMemo(
    () =>
      viewedAuditResult
        ? {
            ...viewedAuditResult,
            violations: scopedRawViolations,
          }
        : null,
    [scopedRawViolations, viewedAuditResult],
  )

  const clearHighlightsOnPage = useCallback(
    async (showFeedback = false) => {
      try {
        await sendMessageToActiveTab({ action: 'CLEAR_HIGHLIGHTS' })
        if (showFeedback) message.success(t('popup.messages.highlightsCleared'))
      } catch (error) {
        console.error('Erro ao limpar destaques:', error)
        if (showFeedback) message.error(t('popup.messages.highlightsClearError'))
      }
    },
    [sendMessageToActiveTab],
  )

  const handleRunAudit = useCallback(async () => {
    setLoading(true)
    try {
      await clearHighlightsOnPage(false)
      const result = await runAccessibilityAudit({ includeRecommendations })
      const tab = await getActiveTab()
      setActiveTab(tab)
      const persistAudit = async () => {
        const persistedResult = await saveAuditResult(result, tab.id)
        const history = await getAuditHistoryForUrl(tab.url)
        setAuditResult(persistedResult)
        setAuditHistory(history)
        setSelectedHistoryId(null)
        setShowAboutView(false)
        setPriorityIndex(0)
        setComparisonTargetId(history[0]?.id)
        setComparisonBaselineId(history[1]?.id || history[0]?.id)
        message.success(
          t('popup.messages.auditCompleted', {
            count:
              getDisplayResultForScope(persistedResult, includeRecommendations)?.totalViolations ??
              result.totalViolations,
          }),
        )
        return persistedResult
      }

      const persistedResult = await persistWithQuotaHandling(persistAudit, {
        url: tab.url || result.url,
        scope: 'audit',
        hasUnsavedChanges: true,
      })
      if (!persistedResult) {
        setAuditResult(result)
        setSelectedHistoryId(null)
        setShowAboutView(false)
        setPriorityIndex(0)
        message.warning(t('popup.messages.quotaUnsavedAudit'))
      }
    } catch (error) {
      console.error('Erro ao executar auditoria:', error)
      message.error(error instanceof Error ? error.message : t('popup.messages.auditRunError'))
    } finally {
      setLoading(false)
    }
  }, [clearHighlightsOnPage, includeRecommendations, persistWithQuotaHandling])

  const handleResetAudit = useCallback(async () => {
    setLoading(true)
    try {
      await clearHighlightsOnPage(false)
      await resetAuditCache()
      setAuditResult(null)
      setSelectedHistoryId(auditHistory[0]?.id || null)
      setShowAboutView(false)
      setPriorityIndex(0)
      setComparisonTargetId(auditHistory[0]?.id)
      setComparisonBaselineId(auditHistory[1]?.id || auditHistory[0]?.id)
      message.success(t('popup.messages.auditClearSuccess'))
    } catch (error) {
      console.error('Erro ao resetar:', error)
      message.error(t('popup.messages.auditClearError'))
    } finally {
      setLoading(false)
    }
  }, [auditHistory, clearHighlightsOnPage])

  const handleRecommendationsToggle = useCallback(
    async (checked: boolean) => {
      setIncludeRecommendations(checked)
      await chrome.storage.local.set({ includeRecommendationsPreference: checked })

      if (!checked || isHistoricalView || !auditResult || auditResult.includeRecommendations) {
        return
      }

      setLoading(true)
      try {
        await clearHighlightsOnPage(false)
        const upgradedResult = await runAccessibilityAudit({ includeRecommendations: true })
        const preservedResult: AuditResult = {
          ...upgradedResult,
          id: auditResult.id,
          timestamp: auditResult.timestamp,
          includeRecommendations: true,
        }

        syncAuditResultUpdate(preservedResult)
        const persisted = await persistWithQuotaHandling(
          async () => {
            await updateStoredAuditResult(preservedResult, activeTab?.id)
            return true
          },
          { url: preservedResult.url, scope: 'audit', hasUnsavedChanges: true },
        )
        if (persisted === null) {
          message.warning(t('popup.messages.quotaUnsavedAudit'))
          return
        }

        const refreshedHistory = await getAuditHistoryForUrl(activeTab?.url || preservedResult.url)
        setAuditHistory(refreshedHistory)
        message.success(t('popup.messages.recommendationsIncluded'))
      } catch (error) {
        console.error('Erro ao incluir recomendações:', error)
        setIncludeRecommendations(false)
        await chrome.storage.local.set({ includeRecommendationsPreference: false })
        message.error(t('popup.messages.recommendationsLoadError'))
      } finally {
        setLoading(false)
      }
    },
    [
      activeTab?.id,
      activeTab?.url,
      auditResult,
      clearHighlightsOnPage,
      isHistoricalView,
      persistWithQuotaHandling,
      syncAuditResultUpdate,
    ],
  )

  const handleExportJSON = useCallback(() => {
    if (!displayedAuditResult) {
      message.warning(t('popup.messages.noAuditToExport'))
      return
    }

    const dataStr = JSON.stringify(buildExportableAuditResult(displayedAuditResult), null, 2)
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.auditFilePrefix')}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('popup.messages.exportJsonSuccess'))
  }, [displayedAuditResult])

  const handleExportCSV = useCallback(() => {
    if (!displayedAuditResult || displayedAuditResult.violations.length === 0) {
      message.warning(t('popup.messages.noViolationsToExport'))
      return
    }

    const headers = [
      t('shared.exports.csvHeaders.id'),
      t('shared.exports.csvHeaders.rule'),
      t('shared.exports.csvHeaders.nbrReference'),
      t('shared.exports.csvHeaders.severity'),
      t('shared.exports.csvHeaders.message'),
      t('shared.exports.csvHeaders.suggestion'),
    ]
    const rows = displayedAuditResult.violations.map((violation) => [
      violation.id,
      violation.ruleName,
      violation.nbrReference,
      violation.severity,
      violation.message,
      violation.suggestion,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.auditFilePrefix')}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('popup.messages.exportCsvSuccess'))
  }, [displayedAuditResult])

  const handleExportSummary = useCallback(() => {
    if (!displayedAuditResult) {
      message.warning(t('popup.messages.noAuditToExport'))
      return
    }

    const markdown = buildAuditSummaryMarkdown(displayedAuditResult)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.summaryFilePrefix')}-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('popup.messages.exportSummarySuccess'))
  }, [displayedAuditResult])

  const handleOpenImportPicker = useCallback(() => {
    importInputRef.current?.click()
  }, [])

  const handleImportAuditFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      setLoading(true)
      try {
        const rawContent = await file.text()
        const parsedPayload = JSON.parse(rawContent) as unknown
        const importedEntry = parseImportedAuditReport(parsedPayload)
        const persistImportedAudit = async () => {
          const persisted = await importAuditReportToHistory(importedEntry)
          const tab = activeTab ?? (await getActiveTab())
          setActiveTab(tab)

          const refreshedHistory = await getAuditHistoryForUrl(tab.url)
          const importedInCurrentUrl = refreshedHistory.some(
            (entry) => entry.id === persisted.entry.id,
          )

          if (importedInCurrentUrl) {
            setAuditHistory(refreshedHistory)
            setSelectedHistoryId(persisted.entry.id)
            setComparisonTargetId(refreshedHistory[0]?.id)
            setComparisonBaselineId(refreshedHistory[1]?.id || refreshedHistory[0]?.id)
            setActiveTabKey('history')
            setShowAboutView(false)
            message.success(t('popup.messages.importReadyForComparison'))
            return persisted
          }

          message.success(t('popup.messages.importStoredForUrl', { url: persisted.entry.url }))
          return persisted
        }

        const persisted = await persistWithQuotaHandling(persistImportedAudit, {
          url: importedEntry.url,
          scope: 'history',
          hasUnsavedChanges: true,
        })

        if (!persisted) {
          message.warning(t('popup.messages.quotaUnsavedImport'))
          return
        }
      } catch (error) {
        console.error('Erro ao importar relatório:', error)
        message.error(
          error instanceof Error ? error.message : t('popup.messages.importAuditError'),
        )
      } finally {
        setLoading(false)
      }
    },
    [activeTab, persistWithQuotaHandling],
  )

  const handleFilterChange = useCallback(
    async (filter: VisionSimulationFilter) => {
      await chrome.storage.local.set({ visionFilter: filter })
      if (!activeTab?.id) return
      void chrome.tabs.sendMessage(activeTab.id, { action: 'APPLY_VISION_FILTER', filter })
    },
    [activeTab?.id],
  )

  const handleHighlightAll = useCallback(async () => {
    if (!displayedAuditResult || isHistoricalView) return

    try {
      await sendMessageToActiveTab({
        action: 'HIGHLIGHT_ALL_VIOLATIONS',
        violations: displayedAuditResult.violations,
      })
      message.success(t('popup.messages.highlightsApplied'))
    } catch (error) {
      console.error('Erro ao destacar violações:', error)
      message.error(t('popup.messages.highlightError'))
    }
  }, [displayedAuditResult, isHistoricalView, sendMessageToActiveTab])

  const handleHighlightViolation = useCallback(
    async (violation: Violation) => {
      try {
        await sendMessageToActiveTab({
          action: 'HIGHLIGHT_VIOLATION',
          violation,
        })
      } catch (error) {
        console.error('Erro ao destacar violação:', error)
      }
    },
    [sendMessageToActiveTab],
  )

  const comparisonEntries = useMemo(() => {
    const byId = new Map<string, AuditHistoryEntry>()
    auditHistory.forEach((entry) => byId.set(entry.id, entry))
    if (auditResult?.id) byId.set(auditResult.id, auditResult as AuditHistoryEntry)
    return Array.from(byId.values()).sort((left, right) => right.timestamp - left.timestamp)
  }, [auditHistory, auditResult])

  const comparisonSummary = useMemo(() => {
    if (
      !comparisonBaselineId ||
      !comparisonTargetId ||
      comparisonBaselineId === comparisonTargetId
    ) {
      return null
    }

    const baseline = comparisonEntries.find((entry) => entry.id === comparisonBaselineId)
    const target = comparisonEntries.find((entry) => entry.id === comparisonTargetId)
    if (!baseline || !target) return null
    return compareAuditResults(baseline, target)
  }, [comparisonBaselineId, comparisonEntries, comparisonTargetId])

  const comparisonTrend = useMemo(() => getComparisonTrend(comparisonSummary), [comparisonSummary])

  const handleExportComparisonReport = useCallback(() => {
    if (!comparisonSummary || !comparisonTrend) {
      message.warning(t('popup.messages.comparisonSelectWarning'))
      return
    }

    const lines = [
      `# ${t('popup.history.exportTitle')}`,
      '',
      `- ${t('popup.history.exportUrl')}: ${activeTab?.url || viewedAuditResult?.url || ''}`,
      `- ${t('popup.history.exportBaseline')}: ${new Date(comparisonSummary.baselineTimestamp).toLocaleString('pt-BR')}`,
      `- ${t('popup.history.exportTarget')}: ${new Date(comparisonSummary.targetTimestamp).toLocaleString('pt-BR')}`,
      `- ${t('popup.history.exportResult')}: ${comparisonTrend.label}`,
      '',
      `## ${t('popup.history.exportIndicatorsTitle')}`,
      '',
      `- ${t('popup.history.exportVisibleItems')}: ${comparisonSummary.baselineOpenCount} -> ${comparisonSummary.targetOpenCount} (${comparisonSummary.openIssuesDeltaPercentage}%)`,
      `- ${t('popup.history.exportNewProblems')}: ${comparisonSummary.newViolations.length}`,
      `- ${t('popup.history.exportResolvedProblems')}: ${comparisonSummary.resolvedViolations.length}`,
      `- ${t('popup.history.exportPersistentProblems')}: ${comparisonSummary.persistentViolations.length}`,
      `- ${t('popup.history.exportNotes')}: ${comparisonSummary.baselineNoteCount} -> ${comparisonSummary.targetNoteCount} (${comparisonSummary.notesDeltaPercentage}%)`,
      `- Confirmações humanas: ${comparisonSummary.baselineConfirmedReviews} -> ${comparisonSummary.targetConfirmedReviews} (${comparisonSummary.confirmedReviewsDeltaPercentage}%)`,
      `- ${t('popup.history.exportCompletedReview')}: ${comparisonSummary.baselineConfirmedReviews + comparisonSummary.baselineDismissedReviews} -> ${comparisonSummary.targetConfirmedReviews + comparisonSummary.targetDismissedReviews}`,
      `- ${t('popup.history.exportPendingReview')}: ${comparisonSummary.baselinePendingReviews} -> ${comparisonSummary.targetPendingReviews}`,
      '',
      `## ${t('popup.history.exportHumanReviewTitle')}`,
      '',
      `- ${t('popup.history.exportConfirmedReview')}: ${comparisonSummary.baselineConfirmedReviews} -> ${comparisonSummary.targetConfirmedReviews}`,
      `- ${t('popup.history.exportDismissedReview')}: ${comparisonSummary.baselineDismissedReviews} -> ${comparisonSummary.targetDismissedReviews}`,
      `- ${t('popup.history.exportPendingReviewItems')}: ${comparisonSummary.baselinePendingReviews} -> ${comparisonSummary.targetPendingReviews}`,
      '',
      `## ${t('popup.history.exportQuickReadingTitle')}`,
      '',
      getComparisonQuickReadingLabel(comparisonTrend.label),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.comparisonFilePrefix')}-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('popup.messages.comparisonExported'))
  }, [activeTab?.url, comparisonSummary, comparisonTrend, viewedAuditResult?.url])

  const handleExportComparisonJson = useCallback(() => {
    if (!comparisonSummary) {
      message.warning(t('popup.messages.comparisonSelectWarning'))
      return
    }

    const dataStr = JSON.stringify(comparisonSummary, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.comparisonFilePrefix')}-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('popup.messages.comparisonExportedJson'))
  }, [comparisonSummary])

  const handleExportComparisonCsv = useCallback(() => {
    if (!comparisonSummary) {
      message.warning(t('popup.messages.comparisonSelectWarning'))
      return
    }

    const rows = [
      [
        t('popup.history.comparisonCsv.indicator'),
        t('popup.history.comparisonCsv.baseline'),
        t('popup.history.comparisonCsv.target'),
        t('popup.history.comparisonCsv.deltaPercentage'),
      ],
      [
        t('popup.history.comparisonCsv.visibleItems'),
        comparisonSummary.baselineOpenCount,
        comparisonSummary.targetOpenCount,
        comparisonSummary.openIssuesDeltaPercentage,
      ],
      [
        t('popup.history.comparisonCsv.completedHumanReview'),
        comparisonSummary.baselineConfirmedReviews + comparisonSummary.baselineDismissedReviews,
        comparisonSummary.targetConfirmedReviews + comparisonSummary.targetDismissedReviews,
        '',
      ],
      [
        t('popup.history.comparisonCsv.pendingHumanReview'),
        comparisonSummary.baselinePendingReviews,
        comparisonSummary.targetPendingReviews,
        '',
      ],
      [
        t('popup.history.comparisonCsv.confirmedHumanReview'),
        comparisonSummary.baselineConfirmedReviews,
        comparisonSummary.targetConfirmedReviews,
        comparisonSummary.confirmedReviewsDeltaPercentage,
      ],
      [
        t('popup.history.comparisonCsv.dismissedHumanReview'),
        comparisonSummary.baselineDismissedReviews,
        comparisonSummary.targetDismissedReviews,
        '',
      ],
      [
        t('popup.history.comparisonCsv.pendingHumanItems'),
        comparisonSummary.baselinePendingReviews,
        comparisonSummary.targetPendingReviews,
        '',
      ],
      [
        t('popup.history.comparisonCsv.notes'),
        comparisonSummary.baselineNoteCount,
        comparisonSummary.targetNoteCount,
        comparisonSummary.notesDeltaPercentage,
      ],
      [
        t('popup.history.comparisonCsv.newProblems'),
        '',
        comparisonSummary.newViolations.length,
        '',
      ],
      [
        t('popup.history.comparisonCsv.resolvedProblems'),
        comparisonSummary.resolvedViolations.length,
        '',
        '',
      ],
      [
        t('popup.history.comparisonCsv.persistentProblems'),
        '',
        comparisonSummary.persistentViolations.length,
        '',
      ],
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.comparisonFilePrefix')}-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success(t('popup.messages.comparisonExportedCsv'))
  }, [comparisonSummary])

  const priorityViolations = useMemo(
    () =>
      displayedAuditResult && !isHistoricalView
        ? getPriorityViolations(displayedAuditResult.violations)
        : [],
    [displayedAuditResult, isHistoricalView],
  )

  const handleHumanReviewStatusChange = useCallback(
    async (violation: Violation, status: HumanReviewStatus) => {
      if (!viewedAuditResult) return

      const updatedResult: AuditResult = {
        ...viewedAuditResult,
        violations: viewedAuditResult.violations.map((currentViolation) =>
          currentViolation.id === violation.id
            ? { ...currentViolation, humanReviewStatus: status }
            : currentViolation,
        ),
      }

      syncAuditResultUpdate(updatedResult)
      const persisted = await persistWithQuotaHandling(
        async () => {
          await updateStoredAuditResult(updatedResult, activeTab?.id)
          return true
        },
        { url: updatedResult.url, scope: 'review', hasUnsavedChanges: true },
      )
      if (persisted === null) {
        message.warning(t('popup.messages.quotaUnsavedReview'))
      }
    },
    [activeTab?.id, persistWithQuotaHandling, syncAuditResultUpdate, viewedAuditResult],
  )

  const handleViolationNoteChange = useCallback(
    async (violation: Violation, note: string) => {
      if (!viewedAuditResult) return

      const updatedResult: AuditResult = {
        ...viewedAuditResult,
        violations: viewedAuditResult.violations.map((currentViolation) =>
          currentViolation.id === violation.id
            ? {
                ...currentViolation,
                userNote: note || undefined,
                noteUpdatedAt: note ? Date.now() : undefined,
              }
            : currentViolation,
        ),
      }

      syncAuditResultUpdate(updatedResult)
      const persisted = await persistWithQuotaHandling(
        async () => {
          await updateStoredAuditResult(updatedResult, activeTab?.id)
          return true
        },
        { url: updatedResult.url, scope: 'review', hasUnsavedChanges: true },
      )
      if (persisted === null) {
        message.warning(t('popup.messages.quotaUnsavedReview'))
        return
      }
      message.success(note ? t('popup.messages.noteSaved') : t('popup.messages.noteRemoved'))
    },
    [activeTab?.id, persistWithQuotaHandling, syncAuditResultUpdate, viewedAuditResult],
  )

  const handleViolationContrastOverrideChange = useCallback(
    async (violation: Violation, override: Violation['userContrastOverride'] | undefined) => {
      if (!viewedAuditResult) return

      const updatedResult: AuditResult = {
        ...viewedAuditResult,
        violations: viewedAuditResult.violations.map((currentViolation) =>
          currentViolation.id === violation.id
            ? {
                ...currentViolation,
                userContrastOverride: override,
              }
            : currentViolation,
        ),
      }

      syncAuditResultUpdate(updatedResult)
      const persisted = await persistWithQuotaHandling(
        async () => {
          await updateStoredAuditResult(updatedResult, activeTab?.id)
          return true
        },
        { url: updatedResult.url, scope: 'review', hasUnsavedChanges: true },
      )
      if (persisted === null) {
        message.warning(t('popup.messages.quotaUnsavedReview'))
        return
      }
      message.success(
        override ? t('popup.messages.contrastSaved') : t('popup.messages.contrastRemoved'),
      )
    },
    [activeTab?.id, persistWithQuotaHandling, syncAuditResultUpdate, viewedAuditResult],
  )

  const handleResolveQuotaIssue = useCallback(
    async (strategy: 'current-url' | 'oldest-audit' | 'global') => {
      if (!quotaIssue || !quotaRetryRef.current) return

      setQuotaRecoveryLoading(true)
      try {
        if (strategy === 'current-url') {
          await clearAuditHistoryForUrl(quotaIssue.url)
        } else if (strategy === 'oldest-audit') {
          await deleteOldestAuditHistoryEntry()
        } else {
          await compactAuditStorage(activeTab?.id)
        }

        await quotaRetryRef.current()
        const refreshedHistory = await getAuditHistoryForUrl(quotaIssue.url)
        setAuditHistory(refreshedHistory)
        setComparisonTargetId(refreshedHistory[0]?.id)
        setComparisonBaselineId(refreshedHistory[1]?.id || refreshedHistory[0]?.id)
        setQuotaIssue(null)
        setIsQuotaModalOpen(false)
        quotaRetryRef.current = null
        message.success(t('popup.messages.quotaRecovered'))
      } catch (error) {
        console.error('Erro ao recuperar quota do storage:', error)
        if (isAuditStorageQuotaError(error)) {
          message.error(t('popup.messages.quotaRecoveryFailed'))
          return
        }
        message.error(
          error instanceof Error ? error.message : t('popup.messages.quotaRecoveryFailed'),
        )
      } finally {
        setQuotaRecoveryLoading(false)
      }
    },
    [activeTab?.id, quotaIssue],
  )

  const handleNextPriorityIssue = useCallback(async () => {
    if (isHistoricalView) {
      message.info(t('popup.messages.historyHighlightUnavailable'))
      return
    }
    if (priorityViolations.length === 0) {
      message.info(t('popup.messages.noPriorityAvailable'))
      return
    }

    const nextViolation = priorityViolations[priorityIndex % priorityViolations.length]
    await handleHighlightViolation(nextViolation)
    setPriorityIndex((current) => (current + 1) % priorityViolations.length)
    message.success(t('popup.messages.priorityFocus', { name: nextViolation.ruleName }))
  }, [handleHighlightViolation, isHistoricalView, priorityIndex, priorityViolations])

  const footerActions = useMemo(() => {
    if (!displayedAuditResult) return []

    return [
      {
        key: 'rerun',
        label: t('shared.actions.rerun'),
        icon: <ReloadOutlined />,
        onClick: handleRunAudit,
        loading,
      },
      {
        key: 'highlight',
        label: t('shared.actions.highlightAll'),
        icon: <EyeOutlined />,
        onClick: handleHighlightAll,
        type: 'primary' as const,
        disabled: isHistoricalView,
      },
      {
        key: 'priority',
        label: t('shared.actions.nextPriority'),
        icon: <FlagOutlined />,
        onClick: handleNextPriorityIssue,
        disabled: isHistoricalView,
      },
      {
        key: 'clear-highlight',
        label: t('shared.actions.clearHighlights'),
        icon: <StopOutlined />,
        onClick: () => {
          void clearHighlightsOnPage(true)
        },
        disabled: isHistoricalView,
      },
      {
        key: 'json',
        label: t('shared.actions.exportJson'),
        icon: <DownloadOutlined />,
        onClick: handleExportJSON,
      },
      {
        key: 'csv',
        label: t('shared.actions.exportCsv'),
        icon: <DownloadOutlined />,
        onClick: handleExportCSV,
      },
      {
        key: 'clear',
        label: t('shared.actions.clearAudit'),
        icon: <DeleteOutlined />,
        onClick: handleResetAudit,
        danger: true,
      },
    ]
  }, [
    displayedAuditResult,
    handleRunAudit,
    loading,
    handleHighlightAll,
    isHistoricalView,
    handleNextPriorityIssue,
    clearHighlightsOnPage,
    handleExportJSON,
    handleExportCSV,
    handleResetAudit,
  ])

  const tabItems = useMemo(() => {
    if (!displayedAuditResult) return []

    return [
      {
        key: 'summary',
        label: t('popup.tabs.summary'),
        children: (
          <ViolationsSummary
            result={displayedAuditResult}
            reviewSourceResult={reviewSourceResult}
            onDownloadSummary={handleExportSummary}
          />
        ),
      },
      {
        key: 'violations',
        label: t('popup.tabs.violations', { count: displayedAuditResult.totalViolations }),
        children: (
          <ViolationsList
            violations={scopedRawViolations}
            onSelectViolation={isHistoricalView ? undefined : handleHighlightViolation}
            onHumanReviewStatusChange={handleHumanReviewStatusChange}
            onViolationNoteChange={handleViolationNoteChange}
            onViolationContrastOverrideChange={handleViolationContrastOverrideChange}
          />
        ),
      },
      {
        key: 'history',
        label: t('popup.tabs.history', { count: auditHistory.length }),
        children: (
          <HistoryTabPanel
            activeTabTitle={activeTab?.title}
            auditHistory={auditHistory}
            auditResultId={auditResult?.id}
            selectedHistoryId={selectedHistoryId}
            comparisonEntries={comparisonEntries}
            comparisonBaselineId={comparisonBaselineId}
            comparisonTargetId={comparisonTargetId}
            comparisonSummary={comparisonSummary}
            comparisonTrend={comparisonTrend}
            onSelectHistory={(historyId) => {
              setSelectedHistoryId(historyId)
              setPriorityIndex(0)
            }}
            onDeleteHistoryEntry={setHistoryEntryPendingDeletion}
            onComparisonBaselineChange={setComparisonBaselineId}
            onComparisonTargetChange={setComparisonTargetId}
            onExportMarkdown={handleExportComparisonReport}
            onExportJson={handleExportComparisonJson}
            onExportCsv={handleExportComparisonCsv}
            onImportJson={handleOpenImportPicker}
          />
        ),
      },
      {
        key: 'simulator',
        label: t('popup.tabs.simulator'),
        children: <VisionSimulator onFilterChange={handleFilterChange} />,
      },
    ]
  }, [
    displayedAuditResult,
    reviewSourceResult,
    handleExportSummary,
    scopedRawViolations,
    isHistoricalView,
    handleHighlightViolation,
    handleHumanReviewStatusChange,
    handleViolationNoteChange,
    handleViolationContrastOverrideChange,
    activeTab?.title,
    auditHistory,
    auditResult?.id,
    selectedHistoryId,
    comparisonEntries,
    comparisonBaselineId,
    comparisonTargetId,
    comparisonSummary,
    comparisonTrend,
    handleExportComparisonReport,
    handleExportComparisonJson,
    handleExportComparisonCsv,
    handleOpenImportPicker,
    handleFilterChange,
  ])

  return (
    <Layout className="popup-app">
      <Header className="popup-header">
        <div className="header-row">
          <div className="header-content">
            <h1 className="header-title">
              <img src={appIconUrl} alt="" className="header-title-icon" aria-hidden="true" />
              <span>{t('shared.brand.name')}</span>
              <Tag className="header-stage-tag" color="gold">
                {t('shared.states.beta')}
              </Tag>
            </h1>
            <p>
              {activeTab?.title
                ? t('popup.header.activeTab', { title: truncateHeaderTabTitle(activeTab.title) })
                : t('popup.header.fallback')}
            </p>
          </div>
          <Space>
            {showAboutView ? (
              <Button icon={<ArrowLeftOutlined />} onClick={() => setShowAboutView(false)}>
                {t('shared.actions.back')}
              </Button>
            ) : (
              <Button icon={<InfoCircleOutlined />} onClick={() => setShowAboutView(true)}>
                {t('shared.actions.about')}
              </Button>
            )}
          </Space>
        </div>
      </Header>

      <Content className="popup-content">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void handleImportAuditFile(event)
          }}
          hidden
        />
        {initialLoading || loading ? (
          <PopupPanelSkeleton />
        ) : showAboutView || !displayedAuditResult ? (
          <Suspense fallback={<PopupPanelSkeleton />}>
            <AboutPanel
              hasAudit={Boolean(viewedAuditResult)}
              loading={loading}
              onBack={() => setShowAboutView(false)}
              onImport={handleOpenImportPicker}
              onStart={() => {
                void handleRunAudit()
              }}
            />
          </Suspense>
        ) : (
          <>
            <div className="tab-status-strip">
              <div className="tab-status-item">
                <span className="tab-status-label">{t('shared.labels.currentTab')}</span>
                <strong>{activeTab?.title || activeTab?.url || t('shared.labels.untitled')}</strong>
              </div>
              <div className="tab-status-item">
                <span className="tab-status-label">
                  {isHistoricalView ? t('shared.labels.historyOf') : t('shared.labels.auditedAt')}
                </span>
                <strong>
                  <ClockCircleOutlined />{' '}
                  {new Date(displayedAuditResult.timestamp).toLocaleString('pt-BR')}
                </strong>
              </div>
              <div className="tab-status-item tab-status-item-toggle">
                <span className="tab-status-label">{t('popup.scope.toggleLabel')}</span>
                <div className="recommendations-toggle-row">
                  <Switch
                    checked={includeRecommendations}
                    loading={loading}
                    onChange={(checked) => {
                      void handleRecommendationsToggle(checked)
                    }}
                  />
                  <div className="recommendations-toggle-copy">
                    <span className="recommendations-toggle-status">
                      {t('popup.scope.currentScope')}:{' '}
                      {includeRecommendations
                        ? t('popup.scope.currentScopeWithRecommendations')
                        : t('popup.scope.currentScopeRequirementsOnly')}
                    </span>
                    <strong>
                      {includeRecommendations
                        ? t('popup.scope.disableAction')
                        : t('popup.scope.enableAction')}
                    </strong>
                    <span>
                      {includeRecommendations
                        ? t('popup.scope.disableDescription')
                        : t('popup.scope.enableDescription')}
                    </span>
                    <small>{t('popup.scope.normativeNote')}</small>
                  </div>
                </div>
              </div>
              {quotaIssue && !isQuotaModalOpen && (
                <div className="tab-status-item tab-status-item-toggle">
                  <span className="tab-status-label">{t('popup.quota.resumeLabel')}</span>
                  <Button
                    danger
                    className="quota-resume-button"
                    onClick={() => setIsQuotaModalOpen(true)}
                  >
                    {t('popup.quota.actions.reopen')}
                  </Button>
                </div>
              )}
              <Tag color={isHistoricalView ? 'gold' : 'blue'}>
                {isHistoricalView
                  ? t('shared.labels.historyByUrl')
                  : t('shared.labels.currentAudit')}
              </Tag>
            </div>

            {isHistoricalView && (
              <Alert
                className="history-alert"
                type="warning"
                showIcon
                message={t('popup.history.warningTitle')}
                description={t('popup.history.warningDescription')}
              />
            )}

            {quotaIssue && (
              <Alert
                className="history-alert"
                type="error"
                showIcon
                message={t('popup.quota.alertTitle')}
                description={t(
                  getQuotaAlertDescriptionKey(quotaIssue.scope, quotaIssue.hasUnsavedChanges),
                )}
              />
            )}

            <Suspense fallback={<PopupPanelSkeleton />}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabItems} />
            </Suspense>
          </>
        )}
      </Content>

      <Modal
        open={Boolean(historyEntryPendingDeletion)}
        title={t('popup.history.deleteModalTitle')}
        okText={t('popup.history.deleteConfirm')}
        cancelText={t('popup.history.deleteCancel')}
        okButtonProps={{ danger: true }}
        onCancel={() => setHistoryEntryPendingDeletion(null)}
        onOk={async () => {
          if (!historyEntryPendingDeletion) return
          const updatedHistory = await deleteAuditHistoryEntry(
            historyEntryPendingDeletion.url,
            historyEntryPendingDeletion.id,
          )
          setAuditHistory(updatedHistory)
          if (selectedHistoryId === historyEntryPendingDeletion.id) {
            setSelectedHistoryId(null)
          }
          setComparisonTargetId(updatedHistory[0]?.id)
          setComparisonBaselineId(updatedHistory[1]?.id || updatedHistory[0]?.id)
          setHistoryEntryPendingDeletion(null)
          message.success(t('popup.messages.historyDeleted'))
        }}
        getContainer={false}
        centered
      >
        <p>{t('popup.history.deleteModalDescription')}</p>
        {historyEntryPendingDeletion && (
          <p className="history-delete-target">
            <strong>
              {historyEntryPendingDeletion.pageTitle || historyEntryPendingDeletion.url}
            </strong>
          </p>
        )}
      </Modal>

      <Modal
        open={Boolean(quotaIssue) && isQuotaModalOpen}
        title={t('popup.quota.modalTitle')}
        onCancel={() => setIsQuotaModalOpen(false)}
        footer={null}
        getContainer={false}
        centered
        width={480}
      >
        <Space direction="vertical" size={12} className="quota-modal-content">
          <Alert
            type="warning"
            showIcon
            message={t('popup.quota.modalAlertTitle')}
            description={t(
              getQuotaModalAlertDescriptionKey(quotaIssue?.scope ?? 'audit'),
            )}
          />
          <p>{t('popup.quota.modalDescription')}</p>
          <ul className="quota-modal-options">
            <li>{t('popup.quota.options.currentUrl')}</li>
            <li>{t('popup.quota.options.deleteOldestAudit')}</li>
            <li>{t('popup.quota.options.globalCompact')}</li>
            <li>{t('popup.quota.options.dismiss')}</li>
          </ul>
          <div className="quota-modal-actions-grid">
            <Button
              type="primary"
              loading={quotaRecoveryLoading}
              onClick={() => {
                void handleResolveQuotaIssue('current-url')
              }}
            >
              {t('popup.quota.actions.clearCurrentUrl')}
            </Button>
            <Button
              loading={quotaRecoveryLoading}
              onClick={() => {
                void handleResolveQuotaIssue('oldest-audit')
              }}
            >
              {t('popup.quota.actions.deleteOldestAudit')}
            </Button>
            <Button
              loading={quotaRecoveryLoading}
              onClick={() => {
                void handleResolveQuotaIssue('global')
              }}
            >
              {t('popup.quota.actions.compactGlobal')}
            </Button>
            <Button onClick={() => setIsQuotaModalOpen(false)}>
              {t('popup.quota.actions.dismiss')}
            </Button>
          </div>
        </Space>
      </Modal>

      {!showAboutView && (
        <Footer className="popup-footer">
          {footerActions.length > 0 && (
            <div className="footer-actions-grid">
              {footerActions.map((action, index) => {
                const lastIndex = footerActions.length - 1
                const remainder = footerActions.length % 3
                const shouldSpanTwo = remainder === 2 && index === lastIndex
                const shouldSpanThree = remainder === 1 && index === lastIndex

                return (
                  <Button
                    key={action.key}
                    className={[
                      'footer-action',
                      shouldSpanTwo ? 'footer-action-span-2' : '',
                      shouldSpanThree ? 'footer-action-span-3' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type={action.type}
                    icon={action.icon}
                    onClick={action.onClick}
                    loading={action.loading}
                    danger={action.danger}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                )
              })}
            </div>
          )}
        </Footer>
      )}
    </Layout>
  )
}
