import React from 'react';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { t } from '@/i18n';

interface AboutPanelProps {
  hasAudit: boolean;
  loading: boolean;
  onBack: () => void;
  onStart: () => void;
}

export const AboutPanel: React.FC<AboutPanelProps> = React.memo(({
  hasAudit,
  loading,
  onBack,
  onStart,
}) => (
  <div className="empty-state empty-state-with-about">
    <div className="about-card">
      <span className="about-eyebrow">{t('popup.about.eyebrow')}</span>
      <h2>{t('popup.about.title')}</h2>
      <p>{t('popup.about.descriptionA')}</p>
      <p>{t('popup.about.descriptionB')}</p>
    </div>
    <Space>
      {hasAudit && (
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('popup.about.backToAudit')}
        </Button>
      )}
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
));
