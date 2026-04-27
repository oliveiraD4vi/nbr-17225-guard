import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { Alert, Button, ConfigProvider, Empty, Layout, Space, Tag } from 'antd'
import {
  DownloadOutlined,
  PrinterOutlined,
  RobotOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import ptBR from 'antd/locale/pt_BR'
import { ReportSkeleton } from './components/LoadingSkeletons'
import { t } from './i18n'
import type { AuditResult } from './types'
import { buildExportableAuditResult } from './utils/audit-export'
import {
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from './utils/audit-comparison'
import { getActiveTab, getAuditResult } from './utils/audit-engine'
import './styles/theme.css'
import './styles/popup.css'

const ViolationsList = React.lazy(async () => {
  const module = await import('./components/ViolationsList')
  return { default: module.ViolationsList }
})

const ViolationsSummary = React.lazy(async () => {
  const module = await import('./components/ViolationsSummary')
  return { default: module.ViolationsSummary }
})

const { Header, Content, Footer } = Layout

export const ReportApp: React.FC = () => {
  const [auditResult, setAuditResult] = React.useState<AuditResult | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    void loadAuditResult()
  }, [])

  const loadAuditResult = async () => {
    try {
      const tab = await getActiveTab()
      const result = await getAuditResult(tab.id)
      setAuditResult(result)
    } catch (error) {
      console.error('Erro ao carregar resultado:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = React.useCallback(() => {
    window.print()
  }, [])

  const handleExport = React.useCallback(() => {
    if (!auditResult) return

    const dataStr = JSON.stringify(buildExportableAuditResult(auditResult), null, 2)
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t('shared.exports.reportFilePrefix')}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [auditResult])

  const confirmedReviews = auditResult ? getConfirmedHumanReviewCount(auditResult) : 0
  const dismissedReviews = auditResult ? getDismissedHumanReviewCount(auditResult) : 0
  const pendingReviews = auditResult ? getPendingHumanReviewCount(auditResult) : 0

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--guard-color-page-bg)' }}>
      <Header
        style={{
          background: 'var(--guard-color-surface)',
          color: 'var(--guard-color-text-primary)',
          borderBottom: '1px solid var(--guard-color-border)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>{t('report.title')}</h1>
      </Header>

      <Content style={{ padding: '24px' }}>
        {loading ? (
          <ReportSkeleton />
        ) : !auditResult ? (
          <Empty description={t('report.empty')} />
        ) : (
          <>
            <Alert
              style={{ marginBottom: '16px' }}
              type="info"
              showIcon
              message={t('report.introTitle')}
              description={
                <Space wrap size={[8, 8]}>
                  <Tag icon={<RobotOutlined />} color="blue">
                    {t('shared.states.automaticDetection')}
                  </Tag>
                  <Tag icon={<UserSwitchOutlined />} color="gold">
                    {t('shared.states.humanConfirmation')}
                  </Tag>
                  <span>{t('report.introDescription')}</span>
                  <Tag color="red">{t('shared.counts.confirmed', { count: confirmedReviews })}</Tag>
                  <Tag>{t('shared.counts.dismissed', { count: dismissedReviews })}</Tag>
                  <Tag color="gold">{t('shared.counts.pending', { count: pendingReviews })}</Tag>
                </Space>
              }
            />
            <Suspense fallback={<ReportSkeleton />}>
              <ViolationsSummary result={auditResult} />
              <div style={{ marginTop: '24px' }}>
                <h2>{t('report.violationsTitle')}</h2>
                <ViolationsList violations={auditResult.violations} />
              </div>
            </Suspense>
          </>
        )}
      </Content>

      <Footer
        style={{
          textAlign: 'center',
          background: 'var(--guard-color-surface-muted)',
          padding: '16px',
        }}
      >
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            {t('shared.actions.print')}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            {t('shared.actions.exportJson')}
          </Button>
        </Space>
      </Footer>
    </Layout>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: 'var(--guard-color-primary)',
          colorBgBase: 'var(--guard-color-page-bg)',
          colorBgContainer: 'var(--guard-color-surface)',
          colorBorder: 'var(--guard-color-border)',
          colorTextBase: 'var(--guard-color-text-primary)',
          colorTextSecondary: 'var(--guard-color-text-secondary)',
          borderRadius: 8,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
      }}
    >
      <ReportApp />
    </ConfigProvider>
  </React.StrictMode>,
)
