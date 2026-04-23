import React, { useEffect, useState } from 'react';
import { Layout, Button, Space, Tabs, message, Spin } from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { AuditResult, Violation, VisionSimulationFilter } from '@/types';
import { runAccessibilityAudit, saveAuditResult, getAuditResult } from '@/utils/audit-engine';
import { ViolationsSummary } from './ViolationsSummary';
import { ViolationsList } from './ViolationsList';
import { VisionSimulator } from './VisionSimulator';
import '../styles/popup.css';

const { Header, Content, Footer } = Layout;

export const PopupApp: React.FC = () => {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadAuditResult();
  }, []);

  const loadAuditResult = async () => {
    try {
      const result = await getAuditResult();
      if (result) {
        setAuditResult(result);
      }
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const result = await runAccessibilityAudit();
      setAuditResult(result);
      await saveAuditResult(result);
      message.success(`Auditoria concluída! ${result.totalViolations} violações encontradas.`);
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
      await chrome.storage.local.remove('auditResult');
      setAuditResult(null);
      message.success('Auditoria resetada');
    } catch (error) {
      console.error('Erro ao resetar:', error);
      message.error('Erro ao resetar auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!auditResult) {
      message.warning('Nenhuma auditoria para exportar');
      return;
    }

    const dataStr = JSON.stringify(auditResult, null, 2);
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
    if (!auditResult || auditResult.violations.length === 0) {
      message.warning('Nenhuma violação para exportar');
      return;
    }

    const headers = ['ID', 'Regra', 'Referência NBR', 'Severidade', 'Mensagem', 'Sugestão'];
    const rows = auditResult.violations.map(v => [
      v.id,
      v.ruleName,
      v.nbrReference,
      v.severity,
      v.message,
      v.suggestion,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
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

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      chrome.tabs.sendMessage(tabId, {
        action: 'APPLY_VISION_FILTER',
        filter,
      });
    });
  };

  const handleHighlightAll = () => {
    if (!auditResult) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'HIGHLIGHT_ALL_VIOLATIONS',
          violations: auditResult.violations,
        });
      }
    });

    message.success('Todos os elementos foram destacados na página');
  };

  const handleHighlightViolation = (violation: Violation) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'HIGHLIGHT_VIOLATION',
          violation,
        });
      }
    });
  };

  return (
    <Layout className="popup-app">
      <Header className="popup-header">
        <div className="header-content">
          <h1>Guardião NBR 17225</h1>
          <p>Verificador de Acessibilidade Web</p>
        </div>
      </Header>

      <Content className="popup-content">
        <Spin spinning={loading} tip="Analisando página...">
          {!auditResult ? (
            <div className="empty-state">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleRunAudit}
                loading={loading}
              >
                Iniciar Verificação
              </Button>
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'summary',
                  label: 'Sumário',
                  children: <ViolationsSummary result={auditResult} />,
                },
                {
                  key: 'violations',
                  label: `Violações (${auditResult.totalViolations})`,
                  children: (
                    <ViolationsList
                      violations={auditResult.violations}
                      onSelectViolation={handleHighlightViolation}
                    />
                  ),
                },
                {
                  key: 'simulator',
                  label: 'Simulador de Visão',
                  children: <VisionSimulator onFilterChange={handleFilterChange} />,
                },
              ]}
            />
          )}
        </Spin>
      </Content>

      <Footer className="popup-footer">
        <Space wrap>
          {auditResult && (
            <>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRunAudit}
                loading={loading}
              >
                Re-executar
              </Button>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleHighlightAll}
              >
                Ver na Página
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportJSON}
              >
                JSON
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
              >
                CSV
              </Button>
              <Button
                danger
                onClick={handleResetAudit}
              >
                Limpar
              </Button>
            </>
          )}
        </Space>
      </Footer>
    </Layout>
  );
};
