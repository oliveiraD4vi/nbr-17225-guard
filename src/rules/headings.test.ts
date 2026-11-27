import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import {
  headingSemanticRule,
  headingStructureRule,
  headingUsageRule,
  mainHeadingRecommendationRule,
} from './headings'

const paragraph = '<p>Horários de atendimento e canais de contato da unidade.</p>'

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    headingSemanticRule,
    [
      {
        name: 'page with a main heading',
        html: `<h1>Atendimento</h1>${paragraph}`,
        expected: 'pass',
      },
      {
        name: 'page without a main heading',
        html: `<h2>Atendimento</h2>${paragraph}`,
        expected: 'finding',
      },
    ],
  ],
  [
    headingUsageRule,
    [
      {
        name: 'heading followed by its content',
        html: `<h1>Atendimento</h1>${paragraph}`,
        expected: 'pass',
      },
      {
        name: 'heading that names a region holding the content',
        html: `<section aria-labelledby="contato"><h2 id="contato">Contato</h2>${paragraph}</section>`,
        expected: 'pass',
      },
      {
        name: 'heading with nothing under it',
        html: `<h2>Contato</h2><h2>Endereço</h2>${paragraph}`,
        expected: 'review',
      },
    ],
  ],
  [
    mainHeadingRecommendationRule,
    [
      { name: 'one main heading', html: `<h1>Atendimento</h1>${paragraph}`, expected: 'pass' },
      {
        name: 'two main headings',
        html: `<h1>Atendimento</h1>${paragraph}<h1>Contato</h1>${paragraph}`,
        expected: 'review',
      },
    ],
  ],
  [
    headingStructureRule,
    [
      {
        name: 'levels that descend one at a time',
        html: `<h1>Serviços</h1><h2>Consultas</h2><h3>Agendamento</h3>`,
        expected: 'pass',
      },
      {
        name: 'returning to a higher level after a subsection',
        html: `<h1>Serviços</h1><h2>Consultas</h2><h3>Agendamento</h3><h2>Exames</h2>`,
        expected: 'pass',
      },
      {
        name: 'skipping a level',
        html: `<h1>Serviços</h1><h3>Agendamento</h3>`,
        expected: 'finding',
      },
      { name: 'page that starts below level 1', html: `<h2>Serviços</h2>`, expected: 'finding' },
    ],
  ],
]

describeRuleScenarios(scenarios)
