import React from 'react';
import { Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, LinkOutlined, CalendarOutlined } from '@ant-design/icons';
import type { AuditResult } from '@/types';
import { getRequirementScoreData } from '@/utils/audit-score';
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

  const hasViolations = result.totalViolations > 0;
  const requirementScore = getRequirementScoreData(result);

  return (
    <div className="violations-summary">
      <Card className="summary-card">
        <div className="summary-hero">
          <div className="summary-hero-copy">
            <span className="summary-eyebrow">Resumo da auditoria</span>
            <h2>{hasViolations ? 'Ajustes pendentes identificados' : 'Nenhuma violação detectada'}</h2>
            <p>
              {hasViolations
                ? 'Os pontos abaixo priorizam os requisitos obrigatórios e separam recomendações para revisão incremental.'
                : 'A página auditada não apresentou violações nas regras atualmente verificadas pelo motor.'}
            </p>
          </div>
          <div className={`summary-status-pill ${hasViolations ? 'is-warning' : 'is-success'}`}>
            {hasViolations ? <WarningOutlined /> : <CheckCircleOutlined />}
            <span>{hasViolations ? 'Ação necessária' : 'Conforme verificado'}</span>
          </div>
        </div>

        <div className="summary-meta">
          <div className="summary-meta-item">
            <LinkOutlined />
            <span>{result.url}</span>
          </div>
          <div className="summary-meta-item">
            <CalendarOutlined />
            <span>{new Date(result.timestamp).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="summary-score-card">
          <div className="summary-score-copy">
            <span className="summary-stat-label">Nota de requisitos</span>
            <strong>{requirementScore.score}</strong>
            <p>
              Considera apenas os requisitos obrigatórios do escopo v1. Itens ainda pendentes de confirmação humana não entram nesta nota.
            </p>
          </div>
          <div className="summary-score-meta">
            <Tag color={requirementScore.score >= 90 ? 'green' : requirementScore.score >= 70 ? 'gold' : 'red'}>
              {requirementScore.violatedRequirementRules} regra(s) obrigatória(s) com falha
            </Tag>
            {requirementScore.pendingHumanRequirementRules > 0 && (
              <Tag color="gold">
                {requirementScore.pendingHumanRequirementRules} regra(s) aguardando confirmação humana
              </Tag>
            )}
          </div>
        </div>

        <div className="summary-total-wrapper">
          <div className="summary-stat-card is-total">
            <span className="summary-stat-label">Total</span>
            <strong>{result.totalViolations}</strong>
            <small>itens encontrados</small>
          </div>

          <div className="summary-stat-grid">
            <div className="summary-stat-card is-error">
              <span className="summary-stat-label">Requisitos</span>
              <strong>{result.errors}</strong>
              <small>não atendidos</small>
            </div>
            <div className="summary-stat-card is-warning">
              <span className="summary-stat-label">Recomendações</span>
              <strong>{result.warnings}</strong>
              <small>para revisão</small>
            </div>
            <div className="summary-stat-card is-review">
              <span className="summary-stat-label">Verificação humana</span>
              <strong>{result.humanReviewItems}</strong>
              <small>itens a confirmar</small>
            </div>
          </div>
        </div>

        <div className="summary-breakdown">
          <div className="summary-breakdown-header">
            <h3>Prioridade de revisão</h3>
            <Tag color={hasViolations ? 'orange' : 'green'}>
              {hasViolations ? 'Comece pelos requisitos' : 'Nenhuma prioridade aberta'}
            </Tag>
          </div>

          <div className="summary-priority-list">
            <div className="summary-priority-item">
              <span className="summary-priority-icon is-error">
                <CloseCircleOutlined />
              </span>
              <div>
                <strong>Requisitos obrigatórios</strong>
                <p>Itens marcados como requisito devem ser tratados primeiro, porque representam não conformidades diretas.</p>
              </div>
              <span className="summary-priority-value">{result.errors}</span>
            </div>

            <div className="summary-priority-item">
              <span className="summary-priority-icon is-warning">
                <WarningOutlined />
              </span>
              <div>
                <strong>Recomendações e heurísticas</strong>
                <p>Esses itens dependem de validação contextual e ajudam a fechar lacunas de usabilidade e conformidade.</p>
              </div>
              <span className="summary-priority-value">{result.warnings}</span>
            </div>

            <div className="summary-priority-item">
              <span className="summary-priority-icon is-review">
                <WarningOutlined />
              </span>
              <div>
                <strong>Confirmação humana</strong>
                <p>Esses itens são indícios fortes, mas a conclusão depende de verificar o comportamento real, o contexto visual ou o fluxo da interface.</p>
              </div>
              <span className="summary-priority-value">{result.humanReviewItems}</span>
            </div>
          </div>
        </div>

        {!hasViolations && (
          <div className="success-message">
            <CheckCircleOutlined style={{ fontSize: '40px', color: '#166534' }} />
            <p>Auditoria concluída sem violações no conjunto atual de regras verificadas.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
