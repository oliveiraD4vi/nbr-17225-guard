import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Button, Tabs, message, Spin, Tag, Empty, List, Alert, Space, Select, Statistic, Skeleton } from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  StopOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  FileSearchOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import type { AuditHistoryEntry, AuditResult, HumanReviewStatus, Violation, VisionSimulationFilter } from '@/types';
import {
  getActiveTab,
  getAuditHistoryForUrl,
  getAuditResult,
  resetAuditCache,
  runAccessibilityAudit,
  saveAuditResult,
  updateStoredAuditResult,
} from '@/utils/audit-engine';
import {
  compareAuditResults,
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison';
import { buildExportableAuditResult } from '@/utils/audit-export';
import { ViolationsSummary } from './ViolationsSummary';
import { ViolationsList } from './ViolationsList';
import { VisionSimulator } from './VisionSimulator';
import '../styles/popup.css';

const { Header, Content, Footer } = Layout;

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

  const syncAuditResultUpdate = useCallback((updatedResult: AuditResult) => {
    setAuditHistory((currentHistory) =>
      currentHistory.map((entry) => (entry.id === updatedResult.id ? updatedResult as AuditHistoryEntry : entry))
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
    loadAuditForCurrentTab();

    const handleTabActivated = () => {
      loadAuditForCurrentTab();
    };

    const handleTabUpdated = (tabId: number, changeInfo: { status?: string; url?: string }) => {
      if (!activeTab?.id || tabId !== activeTab.id) return;
      if (changeInfo.status === 'complete' || 'url' in changeInfo) {
        loadAuditForCurrentTab();
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
    await chrome.tabs.sendMessage(tab.id, payload);
  }, [activeTab]);

  const clearHighlightsOnPage = useCallback(async (showFeedback = false) => {
    try {
      await sendMessageToActiveTab({ action: 'CLEAR_HIGHLIGHTS' });
      if (showFeedback) {
        message.success('Destaques removidos da página');
      }
    } catch (error) {
      console.error('Erro ao limpar destaques:', error);
      if (showFeedback) {
        message.error('Não foi possível limpar os destaques');
      }
    }
  }, [sendMessageToActiveTab]);

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      await clearHighlightsOnPage(false);
      const result = await runAccessibilityAudit();
      const tab = await getActiveTab();
      setActiveTab(tab);
      const persistedResult = await saveAuditResult(result, tab.id);
      setAuditResult(persistedResult);
      const history = await getAuditHistoryForUrl(tab.url);
      setAuditHistory(history);
      setSelectedHistoryId(null);
      setShowAboutView(false);
      setPriorityIndex(0);
      setComparisonTargetId(history[0]?.id);
      setComparisonBaselineId(history[1]?.id || history[0]?.id);
      message.success(`Auditoria concluída: ${result.totalViolations} item(ns) encontrado(s).`);
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
      message.error(error instanceof Error ? error.message : 'Erro ao executar auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAudit = async () => {
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
      message.success('Auditoria limpa para esta aba');
    } catch (error) {
      console.error('Erro ao resetar:', error);
      message.error('Erro ao limpar auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!viewedAuditResult) {
      message.warning('Nenhuma auditoria para exportar');
      return;
    }

    const dataStr = JSON.stringify(buildExportableAuditResult(viewedAuditResult), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-audit-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Relatório exportado como JSON');
  };

  const handleExportCSV = () => {
    if (!viewedAuditResult || viewedAuditResult.violations.length === 0) {
      message.warning('Nenhuma violação para exportar');
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

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-audit-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Relatório exportado como CSV');
  };

  const handleFilterChange = async (filter: VisionSimulationFilter) => {
    await chrome.storage.local.set({ visionFilter: filter });

    if (!activeTab?.id) return;

    chrome.tabs.sendMessage(activeTab.id, {
      action: 'APPLY_VISION_FILTER',
      filter,
    });
  };

  const handleHighlightAll = async () => {
    if (!viewedAuditResult || isHistoricalView) return;

    try {
      await sendMessageToActiveTab({
        action: 'HIGHLIGHT_ALL_VIOLATIONS',
        violations: viewedAuditResult.violations,
      });
      message.success('Destaques aplicados na página');
    } catch (error) {
      console.error('Erro ao destacar violações:', error);
      message.error('Não foi possível destacar os elementos');
    }
  };

  const handleHighlightViolation = async (violation: Violation) => {
    try {
      await sendMessageToActiveTab({
        action: 'HIGHLIGHT_VIOLATION',
        violation,
      });
    } catch (error) {
      console.error('Erro ao destacar violação:', error);
    }
  };

  const viewedAuditResult = useMemo(() => {
    if (!selectedHistoryId) return auditResult;
    return auditHistory.find((entry) => entry.id === selectedHistoryId) || auditResult;
  }, [auditHistory, auditResult, selectedHistoryId]);

  const isHistoricalView = !!selectedHistoryId;

  const comparisonEntries = useMemo(() => {
    const byId = new Map<string, AuditHistoryEntry>();
    auditHistory.forEach((entry) => {
      byId.set(entry.id, entry);
    });
    if (auditResult?.id) {
      byId.set(auditResult.id, auditResult as AuditHistoryEntry);
    }
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

  const comparisonTrend = useMemo(() => {
    if (!comparisonSummary) return null;

    const delta = comparisonSummary.targetOpenCount - comparisonSummary.baselineOpenCount;
    if (delta < 0) {
      return { icon: <RiseOutlined />, label: 'Melhoria', color: 'green' as const };
    }
    if (delta > 0) {
      return { icon: <FallOutlined />, label: 'Regressão', color: 'red' as const };
    }

    return { icon: <MinusOutlined />, label: 'Estável', color: 'default' as const };
  }, [comparisonSummary]);

  const handleExportComparisonReport = useCallback(() => {
    if (!comparisonSummary || !comparisonTrend) {
      message.warning('Selecione duas auditorias diferentes para exportar a comparação');
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
      comparisonTrend.label === 'Melhoria'
        ? 'A comparação indica redução de problemas visíveis na URL auditada.'
        : comparisonTrend.label === 'Regressão'
          ? 'A comparação indica aumento de problemas visíveis na URL auditada.'
          : 'A comparação não mostrou alteração no volume de problemas visíveis.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-comparacao-${new Date(comparisonSummary.targetTimestamp).toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Comparação exportada');
  }, [activeTab?.url, comparisonSummary, comparisonTrend, viewedAuditResult?.url]);

  const handleExportComparisonJson = useCallback(() => {
    if (!comparisonSummary) {
      message.warning('Selecione duas auditorias diferentes para exportar a comparação');
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
    message.success('Comparação exportada como JSON');
  }, [comparisonSummary]);

  const handleExportComparisonCsv = useCallback(() => {
    if (!comparisonSummary) {
      message.warning('Selecione duas auditorias diferentes para exportar a comparação');
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
    message.success('Comparação exportada como CSV');
  }, [comparisonSummary]);

  const priorityViolations = useMemo(() => (
    viewedAuditResult && !isHistoricalView ? getPriorityViolations(viewedAuditResult.violations) : []
  ), [isHistoricalView, viewedAuditResult]);

  const handleHumanReviewStatusChange = useCallback(async (violation: Violation, status: HumanReviewStatus) => {
    if (!viewedAuditResult) return;

    const updatedResult: AuditResult = {
      ...viewedAuditResult,
      violations: viewedAuditResult.violations.map((currentViolation) =>
        currentViolation.id === violation.id
          ? { ...currentViolation, humanReviewStatus: status }
          : currentViolation
      ),
    };

    syncAuditResultUpdate(updatedResult);
    await updateStoredAuditResult(updatedResult, activeTab?.id);
  }, [activeTab?.id, syncAuditResultUpdate, viewedAuditResult]);

  const handleViolationNoteChange = useCallback(async (violation: Violation, note: string) => {
    if (!viewedAuditResult) return;

    const updatedResult: AuditResult = {
      ...viewedAuditResult,
      violations: viewedAuditResult.violations.map((currentViolation) =>
        currentViolation.id === violation.id
          ? {
              ...currentViolation,
              userNote: note || undefined,
              noteUpdatedAt: note ? Date.now() : undefined,
            }
          : currentViolation
      ),
    };

    syncAuditResultUpdate(updatedResult);
    await updateStoredAuditResult(updatedResult, activeTab?.id);
    message.success(note ? 'Anotação salva' : 'Anotação removida');
  }, [activeTab?.id, syncAuditResultUpdate, viewedAuditResult]);

  const handleNextPriorityIssue = async () => {
    if (isHistoricalView) {
      message.info('Destaque indisponível em auditorias do histórico');
      return;
    }

    if (priorityViolations.length === 0) {
      message.info('Nenhum item prioritário disponível nesta aba');
      return;
    }

    const nextViolation = priorityViolations[priorityIndex % priorityViolations.length];
    await handleHighlightViolation(nextViolation);
    setPriorityIndex((current) => (current + 1) % priorityViolations.length);
    message.success(`Foco no item prioritário: ${nextViolation.ruleName}`);
  };

  const footerActions = useMemo(() => {
    if (!viewedAuditResult) return [];

    return [
      {
        key: 'rerun',
        label: 'Reexecutar',
        icon: <ReloadOutlined />,
        onClick: handleRunAudit,
        loading,
      },
      {
        key: 'highlight',
        label: 'Destacar tudo',
        icon: <EyeOutlined />,
        onClick: handleHighlightAll,
        type: 'primary' as const,
        disabled: isHistoricalView,
      },
      {
        key: 'priority',
        label: 'Próximo prioritário',
        icon: <FlagOutlined />,
        onClick: handleNextPriorityIssue,
        disabled: isHistoricalView,
      },
      {
        key: 'clear-highlight',
        label: 'Limpar destaques',
        icon: <StopOutlined />,
        onClick: () => clearHighlightsOnPage(true),
        disabled: isHistoricalView,
      },
      {
        key: 'json',
        label: 'Exportar JSON',
        icon: <DownloadOutlined />,
        onClick: handleExportJSON,
      },
      {
        key: 'csv',
        label: 'Exportar CSV',
        icon: <DownloadOutlined />,
        onClick: handleExportCSV,
      },
      {
        key: 'clear',
        label: 'Limpar auditoria',
        icon: <DeleteOutlined />,
        onClick: handleResetAudit,
        danger: true,
      },
    ];
  }, [viewedAuditResult, isHistoricalView, clearHighlightsOnPage, handleHighlightAll, handleNextPriorityIssue, loading]);

  const pendingHistoryEntries = useMemo(
    () => auditHistory.filter((entry) => getPendingHumanReviewCount(entry) > 0),
    [auditHistory]
  );

  const completedHistoryEntries = useMemo(
    () => auditHistory.filter((entry) => getPendingHumanReviewCount(entry) === 0),
    [auditHistory]
  );

  const renderHistoryList = (entries: AuditHistoryEntry[], sectionTitle: string, emptyDescription: string) => (
    <div className="history-section">
      <div className="history-section-header">
        <strong>{sectionTitle}</strong>
        <span>{entries.length} auditoria(s)</span>
      </div>
      {entries.length === 0 ? (
        <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={entries}
          renderItem={(entry, index) => {
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
                    disabled={entry.id === selectedHistoryId && !auditResult}
                    onClick={() => {
                      setSelectedHistoryId(entry.id === selectedHistoryId ? null : entry.id);
                      setPriorityIndex(0);
                    }}
                  >
                    {entry.id === selectedHistoryId
                      ? (auditResult ? 'Voltar para atual' : 'Usando histórico')
                      : 'Visualizar'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileSearchOutlined />}
                  title={(
                    <div className="history-item-title">
                      <span>{entry.pageTitle || activeTab?.title || entry.url}</span>
                      {!selectedHistoryId && entry.id === auditHistory[0]?.id && <Tag color="blue">Mais recente</Tag>}
                      {entry.id === selectedHistoryId && <Tag color="gold">Em visualização</Tag>}
                      {isCurrent && selectedHistoryId && <Tag color="blue">Atual em foco</Tag>}
                      <Tag color={pendingReviews > 0 ? 'gold' : 'green'}>
                        {pendingReviews > 0 ? 'Revisão pendente' : 'Revisão concluída'}
                      </Tag>
                    </div>
                  )}
                  description={(
                    <div className="history-item-meta">
                      <div className="history-item-meta-row">
                        <span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                        <span>{entry.totalViolations} item(ns)</span>
                      </div>
                      <div className="history-item-tag-row">
                        <Tag color="red">{confirmedReviews} confirmados</Tag>
                        <Tag>{dismissedReviews} descartados</Tag>
                        <Tag color="gold">{pendingReviews} pendentes</Tag>
                        <Tag color="blue">{entry.violations.filter((violation) => Boolean(violation.userNote?.trim())).length} anotações</Tag>
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

  return (
    <Layout className="popup-app">
      <Header className="popup-header">
        <div className="header-row">
          <div className="header-content">
            <h1>Guardião NBR 17225</h1>
            <p>
              {activeTab?.title ? `Aba ativa: ${activeTab.title}` : 'Verificação por aba com foco em requisitos e recomendações.'}
            </p>
          </div>
          <Space>
            {showAboutView ? (
              <Button icon={<ArrowLeftOutlined />} onClick={() => setShowAboutView(false)}>
                Voltar
              </Button>
            ) : (
              <Button icon={<InfoCircleOutlined />} onClick={() => setShowAboutView(true)}>
                Sobre
              </Button>
            )}
          </Space>
        </div>
      </Header>

      <Content className="popup-content">
        <Spin spinning={loading} tip="Analisando página...">
          {initialLoading ? (
            <div className="popup-loading-state" aria-live="polite" aria-busy="true">
              <Skeleton.Button active block className="popup-loading-title" />
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
              <div className="popup-loading-grid">
                <Skeleton.Button active block />
                <Skeleton.Button active block />
                <Skeleton.Button active block />
              </div>
            </div>
          ) : showAboutView || !viewedAuditResult ? (
            <div className="empty-state empty-state-with-about">
              <div className="about-card">
                <span className="about-eyebrow">Sobre</span>
                <h2>Auditoria assistida da ABNT NBR 17225</h2>
                <p>
                  O Guardião avalia o escopo da versão 1 do catálogo normativo do projeto e separa
                  automaticamente requisitos, recomendações e itens que ainda precisam de confirmação humana.
                </p>
                <p>
                  Use a verificação na aba atual para gerar um diagnóstico por URL, destacar elementos da página
                  e manter um histórico local das auditorias já executadas.
                </p>
              </div>
              <Space>
                {viewedAuditResult && (
                  <Button icon={<ArrowLeftOutlined />} onClick={() => setShowAboutView(false)}>
                    Voltar à auditoria
                  </Button>
                )}
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleRunAudit}
                  loading={loading}
                >
                  Iniciar verificação
                </Button>
              </Space>
            </div>
          ) : (
            <>
              <div className="tab-status-strip">
                <div className="tab-status-item">
                  <span className="tab-status-label">Aba atual</span>
                  <strong>{activeTab?.title || activeTab?.url || 'Sem título'}</strong>
                </div>
                <div className="tab-status-item">
                  <span className="tab-status-label">{isHistoricalView ? 'Histórico de' : 'Auditado em'}</span>
                  <strong><ClockCircleOutlined /> {new Date(viewedAuditResult.timestamp).toLocaleString('pt-BR')}</strong>
                </div>
                <Tag color={isHistoricalView ? 'gold' : 'blue'}>{isHistoricalView ? 'Histórico por URL' : 'Auditoria atual'}</Tag>
              </div>

              {isHistoricalView && (
                <Alert
                  className="history-alert"
                  type="warning"
                  showIcon
                  message="Você está visualizando uma auditoria do histórico"
                  description="Os dados abaixo pertencem a uma execução anterior da mesma URL. Destaques visuais na página atual podem não corresponder a esse estado."
                />
              )}

              <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                items={[
                  {
                    key: 'summary',
                    label: 'Resumo',
                    children: <ViolationsSummary result={viewedAuditResult} />,
                  },
                  {
                    key: 'violations',
                    label: `Violações (${viewedAuditResult.totalViolations})`,
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
                    label: `Histórico (${auditHistory.length})`,
                    children: (
                      <div className="history-tab">
                        {comparisonEntries.length >= 2 && (
                          <div className="history-comparison-card">
                            <div className="history-comparison-header">
                              <div>
                                <strong>Comparar auditorias</strong>
                                <p>Compare a evolução desta URL entre duas execuções salvas.</p>
                              </div>
                              <Space>
                                {comparisonTrend && (
                                  <Tag color={comparisonTrend.color}>
                                    {comparisonTrend.icon} {comparisonTrend.label}
                                  </Tag>
                                )}
                                <Button size="small" icon={<DownloadOutlined />} onClick={handleExportComparisonReport} disabled={!comparisonSummary}>
                                  Exportar MD
                                </Button>
                                <Button size="small" icon={<DownloadOutlined />} onClick={handleExportComparisonJson} disabled={!comparisonSummary}>
                                  JSON
                                </Button>
                                <Button size="small" icon={<DownloadOutlined />} onClick={handleExportComparisonCsv} disabled={!comparisonSummary}>
                                  CSV
                                </Button>
                              </Space>
                            </div>

                            <div className="history-comparison-selectors">
                              <div className="history-comparison-field">
                                <span>Base</span>
                                <Select
                                  value={comparisonBaselineId}
                                  onChange={setComparisonBaselineId}
                                  options={comparisonEntries.map((entry) => ({
                                    value: entry.id,
                                    label: `${new Date(entry.timestamp).toLocaleString('pt-BR')} • ${entry.totalViolations} item(ns)`,
                                  }))}
                                />
                              </div>
                              <div className="history-comparison-field">
                                <span>Comparar com</span>
                                <Select
                                  value={comparisonTargetId}
                                  onChange={setComparisonTargetId}
                                  options={comparisonEntries.map((entry) => ({
                                    value: entry.id,
                                    label: `${new Date(entry.timestamp).toLocaleString('pt-BR')} • ${entry.totalViolations} item(ns)`,
                                  }))}
                                />
                              </div>
                            </div>

                            {comparisonSummary ? (
                              <div className="history-comparison-body">
                                <div className="history-comparison-stats">
                                  <Statistic title="Novos problemas" value={comparisonSummary.newViolations.length} />
                                  <Statistic title="Problemas resolvidos" value={comparisonSummary.resolvedViolations.length} />
                                  <Statistic title="Problemas persistentes" value={comparisonSummary.persistentViolations.length} />
                                </div>

                                <div className="history-comparison-meta">
                                  <span>Notas: {comparisonSummary.baselineNoteCount} {'->'} {comparisonSummary.targetNoteCount}</span>
                                  <span>Confirmações humanas: {comparisonSummary.baselineConfirmedReviews} {'->'} {comparisonSummary.targetConfirmedReviews}</span>
                                  <span>Descartes humanos: {comparisonSummary.baselineDismissedReviews} {'->'} {comparisonSummary.targetDismissedReviews}</span>
                                  <span>Pendentes humanos: {comparisonSummary.baselinePendingReviews} {'->'} {comparisonSummary.targetPendingReviews}</span>
                                  <span>Itens visíveis: {comparisonSummary.baselineOpenCount} {'->'} {comparisonSummary.targetOpenCount}</span>
                                  <span>Variação: {comparisonSummary.openIssuesDeltaPercentage}%</span>
                                </div>
                              </div>
                            ) : (
                              <Alert
                                type="info"
                                showIcon
                                message="Selecione duas auditorias diferentes para comparar"
                              />
                            )}
                          </div>
                        )}

                        {auditHistory.length === 0 ? (
                          <Empty description="Nenhuma auditoria anterior encontrada para esta URL" />
                        ) : (
                          <>
                            {renderHistoryList(
                              pendingHistoryEntries,
                              'Revisão pendente',
                              'Nenhuma auditoria com revisão humana pendente'
                            )}
                            {renderHistoryList(
                              completedHistoryEntries,
                              'Revisão concluída',
                              'Nenhuma auditoria com revisão humana concluída'
                            )}
                          </>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'simulator',
                    label: 'Simulador de Visão',
                    children: <VisionSimulator onFilterChange={handleFilterChange} />,
                  },
                ]}
              />
            </>
          )}
        </Spin>
      </Content>

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
    </Layout>
  );
};
