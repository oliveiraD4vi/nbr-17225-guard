import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import {
  abbreviationMeaningRule,
  specialTextSemanticRule,
  specialTextUsageRule,
  textAlignmentRule,
} from './text-content'

const longText =
  'O Guardião organiza cada violação com referência normativa, severidade, elemento afetado e evidência observada na página auditada.'

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    textAlignmentRule,
    [
      { name: 'left-aligned paragraph', html: `<p>${longText}</p>`, expected: 'pass' },
      {
        name: 'short justified paragraph',
        html: '<p style="text-align: justify">Bem-vindo.</p>',
        expected: 'pass',
      },
      {
        name: 'long justified paragraph',
        html: `<p style="text-align: justify">${longText}</p>`,
        expected: 'finding',
      },
    ],
  ],
  [
    specialTextSemanticRule,
    [
      {
        name: 'emphasis with semantic elements',
        html: '<p><strong>Atenção:</strong> prazo <em>encerrado</em>.</p>',
        expected: 'pass',
      },
      {
        name: 'emphasis with presentational elements',
        html: '<p><b>Atenção:</b> prazo.</p>',
        expected: 'finding',
      },
    ],
  ],
  [
    specialTextUsageRule,
    [
      { name: 'plain text', html: `<p>${longText}</p>`, expected: 'pass' },
      {
        name: 'text with emphasis to review',
        html: '<p><strong>Atenção:</strong> prazo encerrado.</p>',
        expected: 'review',
      },
    ],
  ],
  [
    abbreviationMeaningRule,
    [
      {
        name: 'acronyms expanded with abbr',
        html: '<p>O <abbr title="Sistema Único de Saúde">SUS</abbr> e o <abbr title="Instituto Nacional do Seguro Social">INSS</abbr> atendem a população.</p>',
        expected: 'pass',
      },
      {
        name: 'well-known terms',
        html: '<p>Exporte o relatório em PDF ou JSON pela página.</p>',
        expected: 'pass',
      },
      {
        name: 'unexplained acronyms',
        html: '<p>O SUS e o INSS atendem a população em todo o país.</p>',
        expected: 'review',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)
