import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import { contentInRegionsRule, regionSemanticRule, uniqueRegionIdentificationRule } from './regions'

const longText =
  'O Guardião organiza cada violação com referência normativa, severidade, elemento afetado e evidência observada na página.'

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    regionSemanticRule,
    [
      { name: 'page with a main element', html: '<main><h1>Início</h1></main>', expected: 'pass' },
      {
        name: 'page without a main region',
        html: '<div><h1>Início</h1></div>',
        expected: 'finding',
      },
      {
        // Valid ARIA, but the rule asks for the native element.
        name: 'main region declared with role on a div',
        html: '<div role="main"><h1>Início</h1></div>',
        expected: 'finding',
      },
    ],
  ],
  [
    contentInRegionsRule,
    [
      {
        name: 'long text inside a landmark',
        html: `<main><p>${longText}</p></main>`,
        expected: 'pass',
      },
      { name: 'short text outside landmarks', html: '<p>Bem-vindo.</p>', expected: 'pass' },
      { name: 'long text outside landmarks', html: `<div>${longText}</div>`, expected: 'review' },
    ],
  ],
  [
    uniqueRegionIdentificationRule,
    [
      {
        name: 'two navigation regions with different names',
        html: '<nav aria-label="Principal"><a href="/">Início</a></nav><nav aria-label="Rodapé"><a href="/contato">Contato</a></nav>',
        expected: 'pass',
      },
      {
        name: 'a single unnamed navigation region',
        html: '<nav><a href="/">Início</a></nav>',
        expected: 'pass',
      },
      {
        name: 'two unnamed navigation regions',
        html: '<nav><a href="/">Início</a></nav><nav><a href="/contato">Contato</a></nav>',
        expected: 'finding',
      },
    ],
  ],
]
