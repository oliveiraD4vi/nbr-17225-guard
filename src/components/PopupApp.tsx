import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Layout, message, Space, Tabs, Tag } from 'antd';
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
} from '@ant-design/icons';
import { PopupPanelSkeleton } from './LoadingSkeletons';
import { t } from '@/i18n';
import type { AuditHistoryEntry, AuditResult, HumanReviewStatus, Violation, VisionSimulationFilter } from '@/types';
import {
  compareAuditResults,
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison';
import { buildExportableAuditResult } from '@/utils/audit-export';
import {
  ensureContentScriptReady,
  getActiveTab,
  getAuditHistoryForUrl,
  getAuditResult,
  resetAuditCache,
  runAccessibilityAudit,
  saveAuditResult,
  updateStoredAuditResult,
} from '@/utils/audit-engine';
import '../styles/popup.css';

const { Header, Content, Footer } = Layout;

const ViolationsSummary = React.lazy(async () => {
  const module = await import('./ViolationsSummary');
  return { default: module.ViolationsSummary };
});

const ViolationsList = React.lazy(async () => {
  const module = await import('./ViolationsList');
  return { default: module.ViolationsList };
});

const VisionSimulator = React.lazy(async () => {
  const module = await import('./VisionSimulator');
  return { default: module.VisionSimulator };
});

const AboutPanel = React.lazy(async () => {
  const module = await import('./AboutPanel');
  return { default: module.AboutPanel };
});

const HistoryTabPanel = React.lazy(async () => {
  const module = await import('./HistoryTabPanel');
  return { default: module.HistoryTabPanel };
});

const severityRank: Record<Violation['severity'], number> = {
  error: 0,
  warning: 1,
};

function getPriorityViolations(violations: Violation[]): Violation[] {
  const seenRules = new Set<string>();

  return [...violations]
    .sort((left, right) => {
      const severityCompare = severityRank[left.severity] - severityRank[right.severity];
      if (severityCompare !== 0) return severityCompare;
      return left.nbrReference.localeCompare(right.nbrReference, 'pt-BR');
    })
    .filter((violation) => {
      if (seenRules.has(violation.ruleId)) return false;
      seenRules.add(violation.ruleId);
      return true;
    })
    .slice(0, 3);
}

function getComparisonTrend(summary: ReturnType<typeof compareAuditResults> | null) {
  if (!summary) return null;

  const delta = summary.targetOpenCount - summary.baselineOpenCount;
  if (delta < 0) {
    return {
      icon: <RiseOutlined />,
      label: t('shared.states.improvement'),
      color: 'green' as const,
    };
  }
  if (delta > 0) {
    return {
      icon: <FallOutlined />,
      label: t('shared.states.regression'),
      color: 'red' as const,
    };
  }

  return {
    icon: <MinusOutlined />,
    label: t('shared.states.stable'),
    color: 'default' as const,
  };
}

function getComparisonQuickReadingLabel(label: string): string {
  if (label === t('shared.states.improvement')) return t('popup.history.quickReadingImprovement');
  if (label === t('shared.states.regression')) return t('popup.history.quickReadingRegression');
  return t('popup.history.quickReadingStable');
}

export const PopupApp: React.FC = () => {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<(chrome.tabs.Tab & { id: number }) | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('summary');
  const [priorityIndex, setPriorityIndex] = useState(0);
  const [showAboutView, setShowAboutView] = useState(false);
  const [comparisonBaselineId, setComparisonBaselineId] = useState<string | undefined>(undefined);
  const [comparisonTargetId, setComparisonTargetId] = useState<string | undefined>(undefined);
  const appIconUrl = useMemo(() => chrome.runtime.getURL('icons/icon.png'), []);

  const syncAuditResultUpdate = useCallback((updatedResult: AuditResult) => {
    setAuditHistory((currentHistory) =>
      currentHistory.map((entry) => (entry.id === updatedResult.id ? updatedResult as AuditHistoryEntry : entry)),
    );
    setAuditResult((currentResult) => (currentResult?.id === updatedResult.id ? updatedResult : currentResult));
  }, []);

  const loadAuditForCurrentTab = useCallback(async () => {
    try {
      const tab = await getActiveTab();
      setActiveTab(tab);
      const result = await getAuditResult(tab.id);
      const history = await getAuditHistoryForUrl(tab.url);
      setAuditResult(result);
      setAuditHistory(history);
      setSelectedHistoryId(!result && history.length > 0 ? history[0].id : null);
      setShowAboutView(false);
      setPriorityIndex(0);
      setComparisonTargetId(history[0]?.id);
      setComparisonBaselineId(history[1]?.id || history[0]?.id);
    } catch (error) {
      console.error('Erro ao carregar resultado da aba ativa:', error);
      setAuditResult(null);
      setAuditHistory([]);
      setSelectedHistoryId(null);
      setShowAboutView(false);
      setPriorityIndex(0);
      setComparisonBaselineId(undefined);
      setComparisonTargetId(undefined);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditForCurrentTab();

    const handleTabActivated = () => {
      void loadAuditForCurrentTab();
    };

    const handleTabUpdated = (tabId: number, changeInfo: { status?: string; url?: string }) => {
      if (!activeTab?.id || tabId !== activeTab.id) return;
      if (changeInfo.status === 'complete' || 'url' in changeInfo) {
        void loadAuditForCurrentTab();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [activeTab?.id, loadAuditForCurrentTab]);

  const sendMessageToActiveTab = useCallback(async (payload: Record<string, unknown>) => {
    const tab = activeTab ?? await getActiveTab();
    await ensureContentScriptReady(tab.id);
    await chrome.tabs.sendMessage(tab.id, payload);
  }, [activeTab]);

  const viewedAuditResult = useMemo(() => {
    if (!selectedHistoryId) return auditResult;
    return auditHistory.find((entry) => entry.id === selectedHistoryId) || auditResult;
  }, [auditHistory, auditResult, selectedHistoryId]);

  const isHistoricalView = Boolean(selectedHistoryId);

  const clearHighlightsOnPage = useCallback(async (showFeedback = false) => {
    try {
      await sendMessageToActiveTab({ action: 'CLEAR_HIGHLIGHTS' });
      if (showFeedback) message.success(t('popup.messages.highlightsCleared'));
    } catch (error) {
      console.error('Erro ao limpar destaques:', error);
      if (showFeedback) message.error(t('popup.messages.highlightsClearError'));
    }
  }, [sendMessageToActiveTab]);

  const handleRunAudit = useCallback(async () => {
    setLoading(true);
    try {
      await clearHighlightsOnPage(false);
      const result = await runAccessibilityAudit();
      const tab = await getActiveTab();
      setActiveTab(tab);
      const persistedResult = await saveAuditResult(result, tab.id);
      const history = await getAuditHistoryForUrl(tab.url);
      setAuditResult(persistedResult);
      setAuditHistory(history);
      setSelectedHistoryId(null);
      setShowAboutView(false);
      setPriorityIndex(0);
      setComparisonTargetId(history[0]?.id);
      setComparisonBaselineId(history[1]?.id || history[0]?.id);
      message.success(t('popup.messages.auditCompleted', { count: result.totalViolations }));
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
      message.error(error instanceof Error ? error.message : t('popup.messages.auditRunError'));
    } finally {
      setLoading(false);
    }
  }, [clearHighlightsOnPage]);

  const handleResetAudit = useCallback(async () => {
    setLoading(true);
    try {
      await clearHighlightsOnPage(false);
      await resetAuditCache();
      setAuditResult(null);
      setSelectedHistoryId(auditHistory[0]?.id || null);
      setShowAboutView(false);
      setPriorityIndex(0);
      setComparisonTargetId(auditHistory[0]?.id);
      setComparisonBaselineId(auditHistory[1]?.id || auditHistory[0]?.id);
      message.success(t('popup.messages.auditClearSuccess'));
    } catch (error) {
      console.error('Erro ao resetar:', error);
      message.error(t('popup.messages.auditClearError'));
    } finally {
      setLoading(false);
    }
  }, [auditHistory, clearHighlightsOnPage]);

  const handleExportJSON = useCallback(() => {
    if (!viewedAuditResult) {
      message.warning(t('popup.messages.noAuditToExport'));
      return;
    }

    const dataStr = JSON.stringify(buildExportableAuditResult(viewedAuditResult), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-audit-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t('popup.messages.exportJsonSuccess'));
  }, [viewedAuditResult]);

  const handleExportCSV = useCallback(() => {
    if (!viewedAuditResult || viewedAuditResult.violations.length === 0) {
      message.warning(t('popup.messages.noViolationsToExport'));
      return;
    }

    const headers = ['ID', 'Regra', 'Referência NBR', 'Severidade', 'Mensagem', 'Sugestão'];
    const rows = viewedAuditResult.violations.map((violation) => [
      violation.id,
      violation.ruleName,
      violation.nbrReference,
      violation.severity,
      violation.message,
      violation.suggestion,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-audit-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t('popup.messages.exportCsvSuccess'));
  }, [viewedAuditResult]);

  const handleFilterChange = useCallback(async (filter: VisionSimulationFilter) => {
    await chrome.storage.local.set({ visionFilter: filter });
    if (!activeTab?.id) return;
    void chrome.tabs.sendMessage(activeTab.id, { action: 'APPLY_VISION_FILTER', filter });
  }, [activeTab?.id]);

  const handleHighlightAll = useCallback(async () => {
    if (!viewedAuditResult || isHistoricalView) return;

    try {
      await sendMessageToActiveTab({
        action: 'HIGHLIGHT_ALL_VIOLATIONS',
        violations: viewedAuditResult.violations,
      });
      message.success(t('popup.messages.highlightsApplied'));
    } catch (error) {
      console.error('Erro ao destacar violações:', error);
      message.error(t('popup.messages.highlightError'));
    }
  }, [isHistoricalView, sendMessageToActiveTab, viewedAuditResult]);

  const handleHighlightViolation = useCallback(async (violation: Violation) => {
    try {
      await sendMessageToActiveTab({
        action: 'HIGHLIGHT_VIOLATION',
        violation,
      });
    } catch (error) {
      console.error('Erro ao destacar violação:', error);
    }
  }, [sendMessageToActiveTab]);

  const comparisonEntries = useMemo(() => {
    const byId = new Map<string, AuditHistoryEntry>();
    auditHistory.forEach((entry) => byId.set(entry.id, entry));
    if (auditResult?.id) byId.set(auditResult.id, auditResult as AuditHistoryEntry);
    return Array.from(byId.values()).sort((left, right) => right.timestamp - left.timestamp);
  }, [auditHistory, auditResult]);

  const comparisonSummary = useMemo(() => {
    if (!comparisonBaselineId || !comparisonTargetId || comparisonBaselineId === comparisonTargetId) {
      return null;
    }

    const baseline = comparisonEntries.find((entry) => entry.id === comparisonBaselineId);
    const target = comparisonEntries.find((entry) => entry.id === comparisonTargetId);
    if (!baseline || !target) return null;
    return compareAuditResults(baseline, target);
  }, [comparisonBaselineId, comparisonEntries, comparisonTargetId]);

  const comparisonTrend = useMemo(() => getComparisonTrend(comparisonSummary), [comparisonSummary]);

  const handleExportComparisonReport = useCallback(() => {
    if (!comparisonSummary || !comparisonTrend) {
      message.warning(t('popup.messages.comparisonSelectWarning'));
      return;
    }

    const lines = [
      '# Relatório de comparação de auditorias',
      '',
      `- URL: ${activeTab?.url || viewedAuditResult?.url || ''}`,
      `- Base: ${new Date(comparisonSummary.baselineTimestamp).toLocaleString('pt-BR')}`,
      `- Comparada: ${new Date(comparisonSummary.targetTimestamp).toLocaleString('pt-BR')}`,
      `- Resultado: ${comparisonTrend.label}`,
      '',
      '## Indicadores',
      '',
      `- Itens visíveis: ${comparisonSummary.baselineOpenCount} -> ${comparisonSummary.targetOpenCount} (${comparisonSummary.openIssuesDeltaPercentage}%)`,
      `- Novos problemas: ${comparisonSummary.newViolations.length}`,
      `- Problemas resolvidos: ${comparisonSummary.resolvedViolations.length}`,
      `- Problemas persistentes: ${comparisonSummary.persistentViolations.length}`,
      `- Itens com anotação: ${comparisonSummary.baselineNoteCount} -> ${comparisonSummary.targetNoteCount} (${comparisonSummary.notesDeltaPercentage}%)`,
      `- Confirmações humanas: ${comparisonSummary.baselineConfirmedReviews} -> ${comparisonSummary.targetConfirmedReviews} (${comparisonSummary.confirmedReviewsDeltaPercentage}%)`,
      `- Revisão humana concluída: ${comparisonSummary.baselineConfirmedReviews + comparisonSummary.baselineDismissedReviews} -> ${comparisonSummary.targetConfirmedReviews + comparisonSummary.targetDismissedReviews}`,
      `- Revisão humana pendente: ${comparisonSummary.baselinePendingReviews} -> ${comparisonSummary.targetPendingReviews}`,
      '',
      '## Revisão humana',
      '',
      `- Confirmados manualmente: ${comparisonSummary.baselineConfirmedReviews} -> ${comparisonSummary.targetConfirmedReviews}`,
      `- Descartados manualmente: ${comparisonSummary.baselineDismissedReviews} -> ${comparisonSummary.targetDismissedReviews}`,
      `- Pendentes de revisão: ${comparisonSummary.baselinePendingReviews} -> ${comparisonSummary.targetPendingReviews}`,
      '',
      '## Leitura rápida',
      '',
      getComparisonQuickReadingLabel(comparisonTrend.label),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-comparacao-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t('popup.messages.comparisonExported'));
  }, [activeTab?.url, comparisonSummary, comparisonTrend, viewedAuditResult?.url]);

  const handleExportComparisonJson = useCallback(() => {
    if (!comparisonSummary) {
      message.warning(t('popup.messages.comparisonSelectWarning'));
      return;
    }

    const dataStr = JSON.stringify(comparisonSummary, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-comparacao-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t('popup.messages.comparisonExportedJson'));
  }, [comparisonSummary]);

  const handleExportComparisonCsv = useCallback(() => {
    if (!comparisonSummary) {
      message.warning(t('popup.messages.comparisonSelectWarning'));
      return;
    }

    const rows = [
      ['indicador', 'base', 'comparada', 'variacao_percentual'],
      ['itens_visiveis', comparisonSummary.baselineOpenCount, comparisonSummary.targetOpenCount, comparisonSummary.openIssuesDeltaPercentage],
      ['revisao_humana_concluida', comparisonSummary.baselineConfirmedReviews + comparisonSummary.baselineDismissedReviews, comparisonSummary.targetConfirmedReviews + comparisonSummary.targetDismissedReviews, ''],
      ['revisao_humana_pendente', comparisonSummary.baselinePendingReviews, comparisonSummary.targetPendingReviews, ''],
      ['confirmados_humanamente', comparisonSummary.baselineConfirmedReviews, comparisonSummary.targetConfirmedReviews, comparisonSummary.confirmedReviewsDeltaPercentage],
      ['descartados_humanamente', comparisonSummary.baselineDismissedReviews, comparisonSummary.targetDismissedReviews, ''],
      ['pendentes_humanos', comparisonSummary.baselinePendingReviews, comparisonSummary.targetPendingReviews, ''],
      ['anotacoes', comparisonSummary.baselineNoteCount, comparisonSummary.targetNoteCount, comparisonSummary.notesDeltaPercentage],
      ['novos_problemas', '', comparisonSummary.newViolations.length, ''],
      ['problemas_resolvidos', comparisonSummary.resolvedViolations.length, '', ''],
      ['problemas_persistentes', '', comparisonSummary.persistentViolations.length, ''],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-comparacao-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t('popup.messages.comparisonExportedCsv'));
  }, [comparisonSummary]);

  const priorityViolations = useMemo(
    () => (viewedAuditResult && !isHistoricalView ? getPriorityViolations(viewedAuditResult.violations) : []),
    [isHistoricalView, viewedAuditResult],
  );

  const handleHumanReviewStatusChange = useCallback(async (violation: Violation, status: HumanReviewStatus) => {
    if (!viewedAuditResult) return;

    const updatedResult: AuditResult = {
      ...viewedAuditResult,
      violations: viewedAuditResult.violations.map((currentViolation) => (
        currentViolation.id === violation.id
          ? { ...currentViolation, humanReviewStatus: status }
          : currentViolation
      )),
    };

    syncAuditResultUpdate(updatedResult);
    await updateStoredAuditResult(updatedResult, activeTab?.id);
  }, [activeTab?.id, syncAuditResultUpdate, viewedAuditResult]);

  const handleViolationNoteChange = useCallback(async (violation: Violation, note: string) => {
    if (!viewedAuditResult) return;

    const updatedResult: AuditResult = {
      ...viewedAuditResult,
      violations: viewedAuditResult.violations.map((currentViolation) => (
        currentViolation.id === violation.id
          ? {
              ...currentViolation,
              userNote: note || undefined,
              noteUpdatedAt: note ? Date.now() : undefined,
            }
          : currentViolation
      )),
    };

    syncAuditResultUpdate(updatedResult);
    await updateStoredAuditResult(updatedResult, activeTab?.id);
    message.success(note ? t('popup.messages.noteSaved') : t('popup.messages.noteRemoved'));
  }, [activeTab?.id, syncAuditResultUpdate, viewedAuditResult]);

  const handleNextPriorityIssue = useCallback(async () => {
    if (isHistoricalView) {
      message.info(t('popup.messages.historyHighlightUnavailable'));
      return;
    }
    if (priorityViolations.length === 0) {
      message.info(t('popup.messages.noPriorityAvailable'));
      return;
    }

    const nextViolation = priorityViolations[priorityIndex % priorityViolations.length];
    await handleHighlightViolation(nextViolation);
    setPriorityIndex((current) => (current + 1) % priorityViolations.length);
    message.success(t('popup.messages.priorityFocus', { name: nextViolation.ruleName }));
  }, [handleHighlightViolation, isHistoricalView, priorityIndex, priorityViolations]);

  const footerActions = useMemo(() => {
    if (!viewedAuditResult) return [];

    return [
      { key: 'rerun', label: t('shared.actions.rerun'), icon: <ReloadOutlined />, onClick: handleRunAudit, loading },
      { key: 'highlight', label: t('shared.actions.highlightAll'), icon: <EyeOutlined />, onClick: handleHighlightAll, type: 'primary' as const, disabled: isHistoricalView },
      { key: 'priority', label: t('shared.actions.nextPriority'), icon: <FlagOutlined />, onClick: handleNextPriorityIssue, disabled: isHistoricalView },
      { key: 'clear-highlight', label: t('shared.actions.clearHighlights'), icon: <StopOutlined />, onClick: () => { void clearHighlightsOnPage(true); }, disabled: isHistoricalView },
      { key: 'json', label: t('shared.actions.exportJson'), icon: <DownloadOutlined />, onClick: handleExportJSON },
      { key: 'csv', label: t('shared.actions.exportCsv'), icon: <DownloadOutlined />, onClick: handleExportCSV },
      { key: 'clear', label: t('shared.actions.clearAudit'), icon: <DeleteOutlined />, onClick: handleResetAudit, danger: true },
    ];
  }, [
    viewedAuditResult,
    handleRunAudit,
    loading,
    handleHighlightAll,
    isHistoricalView,
    handleNextPriorityIssue,
    clearHighlightsOnPage,
    handleExportJSON,
    handleExportCSV,
    handleResetAudit,
  ]);

  const tabItems = useMemo(() => {
    if (!viewedAuditResult) return [];

    return [
      {
        key: 'summary',
        label: t('popup.tabs.summary'),
        children: <ViolationsSummary result={viewedAuditResult} />,
      },
      {
        key: 'violations',
        label: t('popup.tabs.violations', { count: viewedAuditResult.totalViolations }),
        children: (
          <ViolationsList
            violations={viewedAuditResult.violations}
            onSelectViolation={isHistoricalView ? undefined : handleHighlightViolation}
            onHumanReviewStatusChange={handleHumanReviewStatusChange}
            onViolationNoteChange={handleViolationNoteChange}
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
              setSelectedHistoryId(historyId);
              setPriorityIndex(0);
            }}
            onComparisonBaselineChange={setComparisonBaselineId}
            onComparisonTargetChange={setComparisonTargetId}
            onExportMarkdown={handleExportComparisonReport}
            onExportJson={handleExportComparisonJson}
            onExportCsv={handleExportComparisonCsv}
          />
        ),
      },
      {
        key: 'simulator',
        label: t('popup.tabs.simulator'),
        children: <VisionSimulator onFilterChange={handleFilterChange} />,
      },
    ];
  }, [
    viewedAuditResult,
    isHistoricalView,
    handleHighlightViolation,
    handleHumanReviewStatusChange,
    handleViolationNoteChange,
    auditHistory.length,
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
    handleFilterChange,
  ]);

  return (
    <Layout className="popup-app">
      <Header className="popup-header">
        <div className="header-row">
          <div className="header-content">
            <h1 className="header-title">
              <img src={appIconUrl} alt="" className="header-title-icon" aria-hidden="true" />
              <span>{t('shared.brand.name')}</span>
            </h1>
            <p>
              {activeTab?.title
                ? t('popup.header.activeTab', { title: activeTab.title })
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
        {initialLoading || loading ? (
          <PopupPanelSkeleton />
        ) : showAboutView || !viewedAuditResult ? (
          <Suspense fallback={<PopupPanelSkeleton />}>
            <AboutPanel
              hasAudit={Boolean(viewedAuditResult)}
              loading={loading}
              onBack={() => setShowAboutView(false)}
              onStart={() => { void handleRunAudit(); }}
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
                  <ClockCircleOutlined /> {new Date(viewedAuditResult.timestamp).toLocaleString('pt-BR')}
                </strong>
              </div>
              <Tag color={isHistoricalView ? 'gold' : 'blue'}>
                {isHistoricalView ? t('shared.labels.historyByUrl') : t('shared.labels.currentAudit')}
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

            <Suspense fallback={<PopupPanelSkeleton />}>
              <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabItems} />
            </Suspense>
          </>
        )}
      </Content>

      {!showAboutView && (
        <Footer className="popup-footer">
          {footerActions.length > 0 && (
          <div className="footer-actions-grid">
            {footerActions.map((action, index) => {
              const lastIndex = footerActions.length - 1;
              const remainder = footerActions.length % 3;
              const shouldSpanTwo = remainder === 2 && index === lastIndex;
              const shouldSpanThree = remainder === 1 && index === lastIndex;

              return (
                <Button
                  key={action.key}
                  className={[
                    'footer-action',
                    shouldSpanTwo ? 'footer-action-span-2' : '',
                    shouldSpanThree ? 'footer-action-span-3' : '',
                  ].filter(Boolean).join(' ')}
                  type={action.type}
                  icon={action.icon}
                  onClick={action.onClick}
                  loading={action.loading}
                  danger={action.danger}
                  disabled={action.disabled}
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
          )}
        </Footer>
      )}
    </Layout>
  );
};
