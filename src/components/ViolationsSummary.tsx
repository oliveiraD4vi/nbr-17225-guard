import React from 'react';
import { Card, Statistic, Row, Col, Empty, Spin } from 'antd';
import { BugOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { AuditResult } from '@/types';
import '../styles/violations-summary.css';

interface ViolationsSummaryProps {
  result: AuditResult | null;
  loading?: boolean;
}

export const ViolationsSummary: React.FC<ViolationsSummaryProps> = ({ result, loading = false }) => {
  if (loading) {
    return (
      <div className="violations-summary-loading">
        <Spin size="large" tip="Analisando página..." />
      </div>
    );
  }

  if (!result) {
    return (
      <Empty
        description="Nenhuma auditoria executada"
        style={{ marginTop: '50px' }}
      />
    );
  }

  return (
    <div className="violations-summary">
      <Card className="summary-card">
        <h2>Sumário da Auditoria</h2>
        <p className="summary-url">{result.url}</p>
        <p className="summary-timestamp">
          {new Date(result.timestamp).toLocaleString('pt-BR')}
        </p>

        <Row gutter={[16, 16]} className="statistics-row">
          <Col xs={24} sm={8}>
            <Statistic
              title="Total de Violações"
              value={result.totalViolations}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Requisitos Não Atendidos"
              value={result.errors}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Recomendações"
              value={result.warnings}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>

        {result.totalViolations === 0 && (
          <div className="success-message">
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
            <p>Parabéns! Nenhuma violação detectada.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
