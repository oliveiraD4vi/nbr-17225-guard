import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Button, Tabs, message, Spin, Tag, Empty, List, Alert, Space } from 'antd';
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
} from '@ant-design/icons';
import type { AuditHistoryEntry, AuditResult, Violation, VisionSimulationFilter } from '@/types';
import {
  getActiveTab,
  getAuditHistoryForUrl,
  getAuditResult,
  resetAuditCache,
  runAccessibilityAudit,
  saveAuditResult,
} from '@/utils/audit-engine';
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<(chrome.tabs.Tab & { id: number }) | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('summary');
  const [priorityIndex, setPriorityIndex] = useState(0);
  const [showAboutView, setShowAboutView] = useState(false);

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
    } catch (error) {
      console.error('Erro ao carregar resultado da aba ativa:', error);
      setAuditResult(null);
      setAuditHistory([]);
      setSelectedHistoryId(null);
      setShowAboutView(false);
      setPriorityIndex(0);
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
      setAuditResult(result);
      await saveAuditResult(result, tab.id);
      const history = await getAuditHistoryForUrl(tab.url);
      setAuditHistory(history);
      setSelectedHistoryId(null);
      setShowAboutView(false);
      setPriorityIndex(0);
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

    const dataStr = JSON.stringify(viewedAuditResult, null, 2);
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

  const priorityViolations = useMemo(() => (
    viewedAuditResult && !isHistoricalView ? getPriorityViolations(viewedAuditResult.violations) : []
  ), [isHistoricalView, viewedAuditResult]);

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
          {showAboutView || !viewedAuditResult ? (
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
                      />
                    ),
                  },
                  {
                    key: 'history',
                    label: `Histórico (${auditHistory.length})`,
                    children: (
                      <div className="history-tab">
                        {auditHistory.length === 0 ? (
                          <Empty description="Nenhuma auditoria anterior encontrada para esta URL" />
                        ) : (
                          <List
                            dataSource={auditHistory}
                            renderItem={(entry, index) => {
                              const isCurrent = !selectedHistoryId ? index === 0 : entry.id === selectedHistoryId;
                              return (
                                <List.Item
                                  className={`history-item${entry.id === selectedHistoryId ? ' is-selected' : ''}`}
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
                                    title={
                                      <div className="history-item-title">
                                        <span>{entry.pageTitle || activeTab?.title || entry.url}</span>
                                        {index === 0 && !selectedHistoryId && <Tag color="blue">Mais recente</Tag>}
                                        {entry.id === selectedHistoryId && <Tag color="gold">Em visualização</Tag>}
                                        {isCurrent && selectedHistoryId && <Tag color="blue">Atual em foco</Tag>}
                                      </div>
                                    }
                                    description={
                                      <div className="history-item-meta">
                                        <span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                                        <span>{entry.totalViolations} item(ns)</span>
                                        <span>{entry.humanReviewItems} dependem de confirmação humana</span>
                                      </div>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                          />
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
