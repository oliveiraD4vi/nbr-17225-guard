import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const auditComparisonModule = await import(
  pathToFileURL(path.resolve('dist/audit-comparison.js')).href
);

const compareAuditResults = auditComparisonModule.t;
const getConfirmedHumanReviewCount = auditComparisonModule.n;
const getDismissedHumanReviewCount = auditComparisonModule.r;
const getPendingHumanReviewCount = auditComparisonModule.i;

assert.equal(typeof compareAuditResults, 'function', 'compareAuditResults não foi exportada pelo build');
assert.equal(typeof getConfirmedHumanReviewCount, 'function', 'getConfirmedHumanReviewCount não foi exportada pelo build');
assert.equal(typeof getDismissedHumanReviewCount, 'function', 'getDismissedHumanReviewCount não foi exportada pelo build');
assert.equal(typeof getPendingHumanReviewCount, 'function', 'getPendingHumanReviewCount não foi exportada pelo build');

function createViolation(overrides = {}) {
  return {
    id: 'violation-id',
    ruleId: 'rule-id',
    ruleName: 'Regra',
    nbrReference: '5.0.0',
    description: 'Descrição',
    severity: 'warning',
    wcagLevel: 'A',
    automationCategory: 'Semi-Automatizável',
    requiresHumanReview: false,
    humanReviewStatus: 'not_applicable',
    message: 'Mensagem',
    snippet: '',
    suggestion: 'Sugestão',
    remediationAdvice: 'Correção',
    customId: 'custom-id',
    ...overrides,
  };
}

function createAuditResult(overrides = {}) {
  const violations = overrides.violations ?? [];

  return {
    id: 'audit-id',
    timestamp: 0,
    url: 'https://example.com',
    pageTitle: 'Página',
    totalViolations: violations.length,
    errors: violations.filter((violation) => violation.severity === 'error').length,
    warnings: violations.filter((violation) => violation.severity !== 'error').length,
    humanReviewItems: violations.filter((violation) => violation.requiresHumanReview).length,
    automatedFindings: violations.filter((violation) => !violation.requiresHumanReview).length,
    violations,
    violationsByRule: {},
    violationsBySeverity: { error: [], warning: [] },
    ...overrides,
  };
}

const baseline = createAuditResult({
  id: 'baseline',
  timestamp: 1000,
  violations: [
    createViolation({
      id: 'open-persistent',
      ruleId: 'rule-persistent',
      message: 'Persistente',
      suggestion: 'Corrigir persistente',
      humanReviewStatus: 'not_applicable',
    }),
    createViolation({
      id: 'review-dismissed',
      ruleId: 'rule-dismissed',
      message: 'Descartado',
      suggestion: 'Não deve aparecer',
      requiresHumanReview: true,
      humanReviewStatus: 'dismissed',
    }),
    createViolation({
      id: 'review-confirmed',
      ruleId: 'rule-confirmed',
      message: 'Confirmado',
      suggestion: 'Corrigir confirmado',
      requiresHumanReview: true,
      humanReviewStatus: 'confirmed',
      userNote: 'Confirmado manualmente',
    }),
  ],
});

const target = createAuditResult({
  id: 'target',
  timestamp: 2000,
  violations: [
    createViolation({
      id: 'open-persistent',
      ruleId: 'rule-persistent',
      message: 'Persistente',
      suggestion: 'Corrigir persistente',
      humanReviewStatus: 'not_applicable',
    }),
    createViolation({
      id: 'new-open',
      ruleId: 'rule-new',
      message: 'Novo problema',
      suggestion: 'Corrigir novo',
      humanReviewStatus: 'not_applicable',
    }),
    createViolation({
      id: 'review-pending',
      ruleId: 'rule-pending',
      message: 'Pendente',
      suggestion: 'Revisar pendente',
      requiresHumanReview: true,
      humanReviewStatus: 'pending',
    }),
  ],
});

const summary = compareAuditResults(baseline, target);

assert.equal(summary.baselineId, 'baseline');
assert.equal(summary.targetId, 'target');
assert.equal(summary.persistentViolations.length, 1);
assert.equal(summary.newViolations.length, 2);
assert.equal(summary.resolvedViolations.length, 1);
assert.equal(summary.baselineOpenCount, 2);
assert.equal(summary.targetOpenCount, 3);
assert.equal(summary.baselineConfirmedReviews, 1);
assert.equal(summary.baselineDismissedReviews, 1);
assert.equal(summary.baselinePendingReviews, 0);
assert.equal(summary.targetConfirmedReviews, 0);
assert.equal(summary.targetDismissedReviews, 0);
assert.equal(summary.targetPendingReviews, 1);
assert.equal(summary.baselineNoteCount, 1);
assert.equal(summary.targetNoteCount, 0);

assert.equal(getConfirmedHumanReviewCount(baseline), 1);
assert.equal(getDismissedHumanReviewCount(baseline), 1);
assert.equal(getPendingHumanReviewCount(target), 1);

console.log('Audit history comparison checks passed.');
