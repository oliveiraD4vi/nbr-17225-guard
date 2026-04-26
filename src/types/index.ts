/**
 * Tipos e interfaces para a extensão Guardião NBR 17225
 */

export type SeverityLevel = 'error' | 'warning';
export type WCAGLevel = 'A' | 'AA' | 'AAA';
export const AUTOMATION_CATEGORIES = {
  fully: 'Totalmente Automatizável',
  semi: 'Semi-Automatizável',
  none: 'Não Automatizável',
} as const;

export type AutomationCategory = (typeof AUTOMATION_CATEGORIES)[keyof typeof AUTOMATION_CATEGORIES];
export type HumanReviewStatus = 'not_applicable' | 'pending' | 'confirmed' | 'dismissed';
export type ContrastContext = 'text' | 'component' | 'graphic' | 'focus';

export function isFullyAutomatedCategory(category: AutomationCategory): boolean {
  return category === AUTOMATION_CATEGORIES.fully;
}

export interface Rule {
  id: string;
  nbrReference: string;
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
  automationCategory: AutomationCategory;
  requiresHumanReview: boolean;
  humanReviewStatus: HumanReviewStatus;
  message: string;
  snippet: string;
  suggestion: string;
  remediationAdvice: string;
  element?: HTMLElement;
  elementSelector?: string;
  elementTagName?: string;
  elementAccessibleName?: string;
  elementVisibleText?: string;
  contrastDetails?: {
    context: ContrastContext;
    foregroundHex: string;
    backgroundHex: string;
    measuredRatio: number;
    minimumRatio: number;
    comparisonHex?: string;
    comparisonLabel?: string;
    foregroundLabel?: string;
    backgroundLabel?: string;
  };
  userContrastOverride?: {
    foregroundHex: string;
    backgroundHex: string;
    updatedAt: number;
  };
  userNote?: string;
  noteUpdatedAt?: number;
  inheritedFromHistory?: boolean;
  customId: string;
}

export interface AuditResult {
  id?: string;
  timestamp: number;
  url: string;
  pageTitle?: string;
  includeRecommendations?: boolean;
  totalViolations: number;
  errors: number;
  warnings: number;
  humanReviewItems: number;
  automatedFindings: number;
  violations: Violation[];
  violationsByRule: Record<string, Violation[]>;
  violationsBySeverity: Record<SeverityLevel, Violation[]>;
}

export interface AuditHistoryEntry extends AuditResult {
  id: string;
}

export interface HighlightState {
  isActive: boolean;
  violationId?: string;
}

export interface VisionSimulationFilter {
  type: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'blur';
  intensity: number;
}

export interface ExtensionMessage {
  action: string;
  payload?: unknown;
}

export interface StorageData {
  auditResult?: AuditResult | null;
  auditResultsByTab?: Record<string, AuditResult>;
  auditHistoryByUrl?: Record<string, AuditHistoryEntry[]>;
  highlightState?: HighlightState;
  visionFilter?: VisionSimulationFilter;
  includeRecommendationsPreference?: boolean;
}
