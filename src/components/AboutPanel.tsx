import React from 'react'
import { Button, Space } from 'antd'
import {
  ArrowLeftOutlined,
  FileSearchOutlined,
  GithubOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  EXTENSION_PUBLIC_REPOSITORY_URL,
  PROJECT_PAGE_URL,
  PROJECT_PRIVACY_URL,
  PROJECT_RULES_URL,
} from '@/config/links'
import { t } from '@/i18n'
import { APP_VERSION_LABEL } from '@/version'

interface AboutPanelProps {
  hasAudit: boolean
  loading: boolean
  onBack: () => void
  onImport: () => void
  onStart: () => void
}

export const AboutPanel: React.FC<AboutPanelProps> = React.memo(
  ({ hasAudit, loading, onBack, onImport, onStart }) => (
    <div className="empty-state empty-state-with-about">
      <div className="about-card">
        <span className="about-eyebrow">{t('popup.about.eyebrow')}</span>
        <h2>{t('popup.about.title')}</h2>
        <span className="about-version">
          {t('popup.about.version').replace('{{version}}', APP_VERSION_LABEL)}
        </span>
        <p>{t('popup.about.descriptionA')}</p>
        <p>{t('popup.about.descriptionB')}</p>
        <div className="about-links-grid" aria-label={t('popup.about.links.label')}>
          <Button
            href={PROJECT_PAGE_URL}
            icon={<GlobalOutlined />}
            rel="noreferrer"
            target="_blank"
          >
            {t('popup.about.links.projectPage')}
          </Button>
          <Button
            href={PROJECT_RULES_URL}
            icon={<FileSearchOutlined />}
            rel="noreferrer"
            target="_blank"
          >
            {t('popup.about.links.rules')}
          </Button>
          <Button
            href={PROJECT_PRIVACY_URL}
            icon={<SafetyCertificateOutlined />}
            rel="noreferrer"
            target="_blank"
          >
            {t('popup.about.links.privacy')}
          </Button>
          <Button
            href={EXTENSION_PUBLIC_REPOSITORY_URL}
            icon={<GithubOutlined />}
            rel="noreferrer"
            target="_blank"
          >
            {t('popup.about.links.github')}
          </Button>
        </div>
      </div>
      <Space>
        {hasAudit && (
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            {t('popup.about.backToAudit')}
          </Button>
        )}
        <Button icon={<UploadOutlined />} onClick={onImport}>
          {t('shared.actions.importJson')}
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onStart}
          loading={loading}
        >
          {t('shared.actions.startVerification')}
        </Button>
      </Space>
    </div>
  ),
)
