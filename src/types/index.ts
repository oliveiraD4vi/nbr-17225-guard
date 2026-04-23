/**
 * Tipos e interfaces para a extensão Guardião NBR 17225
 */

export type SeverityLevel = 'error' | 'warning';
export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type AutomationCategory = 'Totalmente Automatizável' | 'Semi-Automatizável' | 'Não Automatizável';

export interface Rule {
  id: string;
  nbrReference: string; // ex: "5.2.1"
  name: string;
  description: string;
  severity: SeverityLevel;
  wcagLevel: WCAGLevel;
  category: AutomationCategory;
  check: () => Promise<Violation[]>;
}

export interface Violation {
  id: string;
  ruleId: string;
  ruleName: string;
  nbrReference: string;
  description: string;
  severity: SeverityLevel;
  wcagLevel: WCAGLevel;
  message: string;
  snippet: string;
  suggestion: string;
  remediationAdvice: string;
  element?: HTMLElement;
  elementSelector?: string;
  elementTagName?: string;
  elementAccessibleName?: string;
  elementVisibleText?: string;
  customId: string;
}

export interface AuditResult {
  timestamp: number;
  url: string;
  totalViolations: number;
  errors: number;
  warnings: number;
  violations: Violation[];
  violationsByRule: Record<string, Violation[]>;
  violationsBySeverity: Record<SeverityLevel, Violation[]>;
}

export interface HighlightState {
  isActive: boolean;
  violationId?: string;
}

export interface VisionSimulationFilter {
  type: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'blur';
  intensity: number; // 0-100
}

export interface ExtensionMessage {
  action: string;
  payload?: unknown;
}

export interface StorageData {
  auditResult?: AuditResult | null;
  auditResultsByTab?: Record<string, AuditResult>;
  highlightState?: HighlightState;
  visionFilter?: VisionSimulationFilter;
}
