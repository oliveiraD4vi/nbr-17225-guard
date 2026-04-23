import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, Layout, Spin, Empty, Button, Space } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import ptBR from 'antd/locale/pt_BR';
import type { AuditResult } from './types';
import { ViolationsList } from './components/ViolationsList';
import { ViolationsSummary } from './components/ViolationsSummary';
import { getActiveTab, getAuditResult } from './utils/audit-engine';
import './styles/popup.css';

const { Header, Content, Footer } = Layout;

export const ReportApp: React.FC = () => {
  const [auditResult, setAuditResult] = React.useState<AuditResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAuditResult();
  }, []);

  const loadAuditResult = async () => {
    try {
      const tab = await getActiveTab();
      const result = await getAuditResult(tab.id);
      setAuditResult(result);
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!auditResult) return;

    const dataStr = JSON.stringify(auditResult, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nbr-17225-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#ffffff', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Guardião NBR 17225 - Relatório detalhado</h1>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Spin spinning={loading} tip="Carregando relatório...">
          {!auditResult ? (
            <Empty description="Nenhum relatório disponível para a aba ativa" />
          ) : (
            <>
              <ViolationsSummary result={auditResult} />
              <div style={{ marginTop: '24px' }}>
                <h2>Detalhes das violações</h2>
                <ViolationsList violations={auditResult.violations} />
              </div>
            </>
          )}
        </Spin>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#f8fafc', padding: '16px' }}>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Imprimir
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Exportar JSON
          </Button>
        </Space>
      </Footer>
    </Layout>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ConfigProvider locale={ptBR}>
      <ReportApp />
    </ConfigProvider>
  </React.StrictMode>
);
