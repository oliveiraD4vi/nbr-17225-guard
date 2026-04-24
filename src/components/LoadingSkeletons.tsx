import React from 'react';
import { Card, Skeleton, Space } from 'antd';

export const SummarySkeleton: React.FC = React.memo(() => (
  <div className="violations-summary">
    <Card className="summary-card">
      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '45%' }} />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 16 }}>
        <Skeleton.Button active block style={{ width: '100%', height: 92 }} />
        <Skeleton.Button active block style={{ width: '100%', height: 92 }} />
        <Skeleton.Button active block style={{ width: '100%', height: 92 }} />
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 16 }}>
        <Skeleton.Button active block style={{ width: '100%', height: 120 }} />
        <Skeleton.Button active block style={{ width: '100%', height: 120 }} />
      </div>
    </Card>
  </div>
));

export const PopupPanelSkeleton: React.FC = React.memo(() => (
  <div className="popup-loading-state" aria-live="polite" aria-busy="true">
    <Skeleton.Button active block className="popup-loading-title" />
    <Skeleton active paragraph={{ rows: 3 }} title={false} />
    <div className="popup-loading-grid">
      <Skeleton.Button active block />
      <Skeleton.Button active block />
      <Skeleton.Button active block />
    </div>
  </div>
));

export const ReportSkeleton: React.FC = React.memo(() => (
  <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <Skeleton active paragraph={{ rows: 1 }} title={{ width: '32%' }} />
    <Skeleton.Button active block style={{ width: '100%', height: 88 }} />
    <Skeleton.Button active block style={{ width: '100%', height: 220 }} />
    <Skeleton.Button active block style={{ width: '100%', height: 280 }} />
  </Space>
));
