import React from 'react';
import { Card, Tag, Button, Collapse, Space, Empty, Tooltip, Tabs } from 'antd';
import { CopyOutlined, LinkOutlined, InfoCircleOutlined, PushpinFilled } from '@ant-design/icons';
import type { Violation } from '@/types';
import '../styles/violations-list.css';

interface ViolationsListProps {
  violations: Violation[];
  onSelectViolation?: (violation: Violation) => void;
}

interface ViolationGroup {
  ruleId: string;
  violations: Violation[];
  topIssueCount: number;
}

const severityRank: Record<Violation['severity'], number> = {
  error: 0,
  warning: 1,
};

function getSeverityColor(severity: string): string {
  return severity === 'error' ? 'red' : 'orange';
}

function getSeverityLabel(severity: string): string {
  return severity === 'error' ? 'Requisito' : 'Recomendação';
}

function getViolationSignature(violation: Violation): string {
  return `${violation.message}|${violation.elementSelector || violation.snippet}`;
}

function sortViolations(violations: Violation[]): Violation[] {
  return [...violations].sort((left, right) => {
    const severityCompare = severityRank[left.severity] - severityRank[right.severity];
    if (severityCompare !== 0) return severityCompare;

    const leftSelector = left.elementSelector || '';
    const rightSelector = right.elementSelector || '';
    return leftSelector.localeCompare(rightSelector, 'pt-BR');
  });
}

function buildGroups(violations: Violation[]): ViolationGroup[] {
  const groupedByRule = violations.reduce((acc, violation) => {
    if (!acc[violation.ruleId]) {
      acc[violation.ruleId] = [];
    }
    acc[violation.ruleId].push(violation);
    return acc;
  }, {} as Record<string, Violation[]>);

  return Object.entries(groupedByRule)
    .map(([ruleId, ruleViolations]) => ({
      ruleId,
      violations: sortViolations(ruleViolations),
      topIssueCount: new Set(ruleViolations.slice(0, 3).map(getViolationSignature)).size,
    }))
    .sort((left, right) => {
      const leftFirst = left.violations[0];
      const rightFirst = right.violations[0];
      const severityCompare = severityRank[leftFirst.severity] - severityRank[rightFirst.severity];
      if (severityCompare !== 0) return severityCompare;
      if (right.violations.length !== left.violations.length) return right.violations.length - left.violations.length;
      return leftFirst.nbrReference.localeCompare(rightFirst.nbrReference, 'pt-BR');
    });
}

function getElementTitle(violation: Violation): string {
  const tag = violation.elementTagName || 'elemento';
  const selector = violation.elementSelector || '';
  const selectorSuffix = selector.startsWith(tag) ? selector.slice(tag.length) : selector;
  return `${tag}${selectorSuffix ? ` ${selectorSuffix}` : ''}`;
}

function renderViolationGroups(
  violations: Violation[],
  onSelectViolation?: (violation: Violation) => void
): React.ReactNode {
  if (violations.length === 0) {
    return <Empty description="Nenhum item nesta categoria" />;
  }

  const groups = buildGroups(violations);
  const topRuleIds = new Set(groups.slice(0, 3).map((group) => group.ruleId));

  const items = groups.map((group) => {
    const firstViolation = group.violations[0];
    const topIssues = group.violations.slice(0, 3);
    const remainingIssues = group.violations.slice(3);

    return {
      key: group.ruleId,
      label: (
        <div className="violation-group-header">
          <div className="violation-group-main">
            <div className="violation-group-title-row">
              <span className="violation-rule-name">{firstViolation.ruleName}</span>
              {topRuleIds.has(group.ruleId) && (
                <Tag className="violation-top-tag" color="volcano">
                  <PushpinFilled /> Prioridade
                </Tag>
              )}
            </div>
            <span className="violation-group-description">{firstViolation.description}</span>
          </div>
          <div className="violation-group-meta">
            <Tag color={getSeverityColor(firstViolation.severity)}>
              {getSeverityLabel(firstViolation.severity)}
            </Tag>
            <Tag>{group.violations.length} ocorrência(s)</Tag>
            <span className="violation-nbr-ref">NBR {firstViolation.nbrReference}</span>
          </div>
        </div>
      ),
      children: (
        <div className="violation-details">
          <div className="violation-top-issues">
            <div className="violation-section-header">
              <strong>Itens prioritários</strong>
              <span>{group.topIssueCount} ponto(s) prioritário(s)</span>
            </div>
            <div className="violation-items">
              {topIssues.map((violation, index) => renderViolationCard(violation, index, onSelectViolation, true))}
            </div>
          </div>

          {remainingIssues.length > 0 && (
            <div className="violation-more-issues">
              <div className="violation-section-header">
                <strong>Demais ocorrências</strong>
                <span>{remainingIssues.length} item(ns)</span>
              </div>
              <div className="violation-items">
                {remainingIssues.map((violation, index) =>
                  renderViolationCard(violation, topIssues.length + index, onSelectViolation, false)
                )}
              </div>
            </div>
          )}
        </div>
      ),
    };
  });

  return <Collapse items={items} />;
}

function renderViolationCard(
  violation: Violation,
  index: number,
  onSelectViolation?: (violation: Violation) => void,
  pinned = false
): React.ReactNode {
  return (
    <Card
      key={violation.id}
      size="small"
      className={`violation-item-card${pinned ? ' is-pinned' : ''}`}
      onClick={() => onSelectViolation?.(violation)}
    >
      <div className="violation-item-header">
        <span className="violation-item-number">#{index + 1}</span>
        <div className="violation-item-heading">
          <span className="violation-item-message">{violation.message}</span>
          <span className="violation-item-reference">
            NBR {violation.nbrReference} - WCAG {violation.wcagLevel}
          </span>
        </div>
      </div>

      <div className="violation-item-content">
        <div className="violation-element-card">
          <strong>Elemento afetado</strong>
          <div className="violation-element-title">{getElementTitle(violation)}</div>

          <div className="violation-element-fields">
            {violation.elementAccessibleName && (
              <div className="violation-element-field">
                <span className="violation-element-field-label">Nome acessível</span>
                <span className="violation-element-field-value">{violation.elementAccessibleName}</span>
              </div>
            )}

            {violation.elementVisibleText && (
              <div className="violation-element-field">
                <span className="violation-element-field-label">Texto visível</span>
                <span className="violation-element-field-value">{violation.elementVisibleText}</span>
              </div>
            )}

            {violation.elementSelector && (
              <div className="violation-element-field">
                <span className="violation-element-field-label">Seletor</span>
                <span className="violation-element-field-value is-monospace">{violation.elementSelector}</span>
              </div>
            )}
          </div>
        </div>

        <div className="violation-suggestion">
          <strong>Sugestão</strong>
          <p>{violation.suggestion}</p>
        </div>

        <div className="violation-remediation">
          <strong>Como corrigir</strong>
          <pre>
            <code>{violation.remediationAdvice}</code>
          </pre>
        </div>

        <Space className="violation-actions">
          <Tooltip title="Copiar seletor do elemento">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(violation.elementSelector || violation.snippet);
              }}
            />
          </Tooltip>
          <Tooltip title="Ir para elemento">
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onSelectViolation?.(violation);
              }}
            />
          </Tooltip>
          <span className="violation-wcag-level">
            <InfoCircleOutlined /> {getSeverityLabel(violation.severity)}
          </span>
        </Space>
      </div>
    </Card>
  );
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  onSelectViolation,
}) => {
  if (!violations || violations.length === 0) {
    return <Empty description="Nenhuma violação encontrada" />;
  }

  const sortedViolations = sortViolations(violations);
  const requirementViolations = sortedViolations.filter((violation) => violation.severity === 'error');
  const recommendationViolations = sortedViolations.filter((violation) => violation.severity !== 'error');

  return (
    <div className="violations-list">
      <Tabs
        className="violations-filter-tabs"
        items={[
          {
            key: 'all',
            label: `Todos (${sortedViolations.length})`,
            children: renderViolationGroups(sortedViolations, onSelectViolation),
          },
          {
            key: 'requirements',
            label: `Requisitos (${requirementViolations.length})`,
            children: renderViolationGroups(requirementViolations, onSelectViolation),
          },
          {
            key: 'recommendations',
            label: `Recomendações (${recommendationViolations.length})`,
            children: renderViolationGroups(recommendationViolations, onSelectViolation),
          },
        ]}
      />
    </div>
  );
};
