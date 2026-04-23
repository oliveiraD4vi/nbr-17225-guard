import React from 'react';
import { Card, Tag, Button, Collapse, Space, Empty, Tooltip } from 'antd';
import { CopyOutlined, LinkOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Violation } from '@/types';
import { escapeHtml } from '@/utils';
import '../styles/violations-list.css';

interface ViolationsListProps {
  violations: Violation[];
  onSelectViolation?: (violation: Violation) => void;
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  onSelectViolation
}) => {
  if (!violations || violations.length === 0) {
    return <Empty description="Nenhuma violação encontrada" />;
  }

  const groupedByRule = violations.reduce((acc, v) => {
    if (!acc[v.ruleId]) {
      acc[v.ruleId] = [];
    }
    acc[v.ruleId].push(v);
    return acc;
  }, {} as Record<string, Violation[]>);

  const getSeverityColor = (severity: string) => {
    return severity === 'error' ? 'red' : 'orange';
  };

  const getSeverityLabel = (severity: string) => {
    return severity === 'error' ? 'Requisito' : 'Recomendação';
  };

  const items = Object.entries(groupedByRule).map(([ruleId, ruleViolations]: [string, Violation[]]) => {
    const firstViolation = ruleViolations[0];

    return {
      key: ruleId,
      label: (
        <div className="violation-group-header">
          <span className="violation-rule-name">{firstViolation.ruleName}</span>
          <Tag color={getSeverityColor(firstViolation.severity)}>
            {getSeverityLabel(firstViolation.severity)}
          </Tag>
          <Tag>{ruleViolations.length} ocorrência(s)</Tag>
          <span className="violation-nbr-ref">NBR {firstViolation.nbrReference}</span>
        </div>
      ),
      children: (
        <div className="violation-details">
          <p className="violation-description">{firstViolation.description}</p>
          
          <div className="violation-items">
            {ruleViolations.map((violation, index) => (
              <Card 
                key={violation.id} 
                size="small" 
                className="violation-item-card"
                onClick={() => onSelectViolation?.(violation)}
              >
                <div className="violation-item-header">
                  <span className="violation-item-number">#{index + 1}</span>
                  <span className="violation-item-message">{violation.message}</span>
                </div>

                <div className="violation-item-content">
                  <div className="violation-snippet">
                    <strong>Elemento:</strong>
                    <pre>
                      <code>{escapeHtml(violation.snippet)}</code>
                    </pre>
                  </div>

                  <div className="violation-suggestion">
                    <strong>Sugestão:</strong>
                    <p>{violation.suggestion}</p>
                  </div>

                  <div className="violation-remediation">
                    <strong>Como corrigir:</strong>
                    <pre>
                      <code>{violation.remediationAdvice}</code>
                    </pre>
                  </div>

                  <Space className="violation-actions">
                    <Tooltip title="Copiar snippet">
                      <Button 
                        type="text" 
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(violation.snippet);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Ir para elemento">
                      <Button 
                        type="text" 
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectViolation?.(violation);
                        }}
                      />
                    </Tooltip>
                    <span className="violation-wcag-level">
                      <InfoCircleOutlined /> WCAG {violation.wcagLevel}
                    </span>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="violations-list">
      <Collapse items={items} />
    </div>
  );
};
