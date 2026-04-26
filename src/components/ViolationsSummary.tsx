import React from 'react';
import { Card, Empty, Tag } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { t } from '@/i18n';
import type { AuditResult } from '@/types';
import {
  getConfirmedHumanReviewCount,
  getDismissedHumanReviewCount,
  getPendingHumanReviewCount,
} from '@/utils/audit-comparison';
import { getRequirementScoreData } from '@/utils/audit-score';
import { SummarySkeleton } from './LoadingSkeletons';
import '../styles/violations-summary.css';

interface ViolationsSummaryProps {
  result: AuditResult | null;
  reviewSourceResult?: AuditResult | null;
  loading?: boolean;
}

export const ViolationsSummary: React.FC<ViolationsSummaryProps> = React.memo(({
  result,
  reviewSourceResult,
  loading = false,
}) => {
  if (loading) {
    return <SummarySkeleton />;
  }

  if (!result) {
    return (
      <Empty
        description={t('summary.empty')}
        style={{ marginTop: '50px' }}
      />
    );
  }

  const hasViolations = result.totalViolations > 0;
  const requirementScore = getRequirementScoreData(result);
  const reviewBase = reviewSourceResult ?? result;
  const confirmedReviews = getConfirmedHumanReviewCount(reviewBase);
  const dismissedReviews = getDismissedHumanReviewCount(reviewBase);
  const pendingReviews = getPendingHumanReviewCount(reviewBase);
  const scoreTone = requirementScore.score >= 90 ? 'good' : requirementScore.score >= 70 ? 'medium' : 'critical';

  return (
    <div className="violations-summary">
      <Card className="summary-card">
        <div className="summary-hero">
          <div className="summary-hero-copy">
            <span className="summary-eyebrow">{t('summary.eyebrow')}</span>
            <h2>{hasViolations ? t('summary.titleWithIssues') : t('summary.titleWithoutIssues')}</h2>
            <p>
              {hasViolations
                ? t('summary.descriptionWithIssues')
                : t('summary.descriptionWithoutIssues')}
            </p>
          </div>
          <div className={`summary-status-pill ${hasViolations ? 'is-warning' : 'is-success'}`}>
            {hasViolations ? <WarningOutlined /> : <CheckCircleOutlined />}
            <span>
              {hasViolations ? t('shared.states.actionRequired') : t('shared.states.verifiedCompliant')}
            </span>
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

        <div className={`summary-score-card is-${scoreTone}`}>
          <div className="summary-score-copy">
            <span className="summary-stat-label">{t('summary.scoreLabel')}</span>
            <strong>{t('summary.scoreOutOf', { score: requirementScore.score })}</strong>
            <p>{t('summary.scoreDescription')}</p>
            <div className="summary-score-meter" aria-hidden="true">
              <span className="summary-score-meter-fill" style={{ width: `${requirementScore.score}%` }} />
            </div>
          </div>
          <div className="summary-score-meta">
            <Tag color={requirementScore.score >= 90 ? 'green' : requirementScore.score >= 70 ? 'gold' : 'red'}>
              {t('summary.failingRequirements', { count: requirementScore.violatedRequirementRules })}
            </Tag>
            {requirementScore.pendingHumanRequirementRules > 0 && (
              <Tag color="gold">
                {t('summary.pendingRequirementReview', {
                  count: requirementScore.pendingHumanRequirementRules,
                })}
              </Tag>
            )}
          </div>
        </div>

        <div className="summary-total-wrapper">
          <div className="summary-stat-card is-total">
            <span className="summary-stat-label">{t('shared.labels.total')}</span>
            <strong>{result.totalViolations}</strong>
            <small>{t('summary.totalItemsFound')}</small>
          </div>

          <div className="summary-stat-grid">
            <div className="summary-stat-card is-error">
              <span className="summary-stat-label">{t('shared.labels.requirements')}</span>
              <strong>{result.errors}</strong>
              <small>{t('summary.requirementsMissed')}</small>
            </div>
            <div className="summary-stat-card is-warning">
              <span className="summary-stat-label">{t('shared.labels.recommendations')}</span>
              <strong>{result.warnings}</strong>
              <small>{t('summary.recommendationsReview')}</small>
            </div>
            <div className="summary-stat-card is-review">
              <span className="summary-stat-label">{t('shared.labels.humanReview')}</span>
              <strong>{result.humanReviewItems}</strong>
              <small>{t('summary.itemsToConfirm')}</small>
            </div>
          </div>
        </div>

        <div className="summary-review-progress">
          <div className="summary-review-progress-header">
            <h3>{t('summary.humanReviewProgress')}</h3>
            <Tag color={pendingReviews > 0 ? 'gold' : 'green'}>
              {pendingReviews > 0 ? t('summary.pendingReviewBadge') : t('summary.completedReviewBadge')}
            </Tag>
          </div>
          <div className="summary-review-progress-grid">
            <div className="summary-review-card is-confirmed">
              <span className="summary-stat-label">{t('summary.confirmed')}</span>
              <strong>{confirmedReviews}</strong>
              <small>{t('summary.confirmedDescription')}</small>
            </div>
            <div className="summary-review-card is-dismissed">
              <span className="summary-stat-label">{t('summary.dismissed')}</span>
              <strong>{dismissedReviews}</strong>
              <small>{t('summary.dismissedDescription')}</small>
            </div>
            <div className="summary-review-card is-pending">
              <span className="summary-stat-label">{t('summary.pending')}</span>
              <strong>{pendingReviews}</strong>
              <small>{t('summary.pendingDescription')}</small>
            </div>
          </div>
        </div>

        <div className="summary-breakdown">
          <div className="summary-breakdown-header">
            <h3>{t('summary.reviewPriority')}</h3>
            <Tag color={hasViolations ? 'orange' : 'green'}>
              {hasViolations ? t('summary.priorityOpen') : t('summary.priorityClear')}
            </Tag>
          </div>

          <div className="summary-priority-list">
            <div className="summary-priority-item">
              <span className="summary-priority-icon is-error">
                <CloseCircleOutlined />
              </span>
              <div>
                <strong>{t('summary.priorityRequirements')}</strong>
                <p>{t('summary.priorityRequirementsDescription')}</p>
              </div>
              <span className="summary-priority-value">{result.errors}</span>
            </div>

            <div className="summary-priority-item">
              <span className="summary-priority-icon is-warning">
                <WarningOutlined />
              </span>
              <div>
                <strong>{t('summary.priorityRecommendations')}</strong>
                <p>{t('summary.priorityRecommendationsDescription')}</p>
              </div>
              <span className="summary-priority-value">{result.warnings}</span>
            </div>

            <div className="summary-priority-item">
              <span className="summary-priority-icon is-review">
                <WarningOutlined />
              </span>
              <div>
                <strong>{t('summary.priorityHumanReview')}</strong>
                <p>{t('summary.priorityHumanReviewDescription')}</p>
              </div>
              <span className="summary-priority-value">{result.humanReviewItems}</span>
            </div>
          </div>
        </div>

        {!hasViolations && (
          <div className="success-message">
            <CheckCircleOutlined style={{ fontSize: '40px', color: '#166534' }} />
            <p>{t('summary.success')}</p>
          </div>
        )}
      </Card>
    </div>
  );
});
