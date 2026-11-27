import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import { listSemanticRule } from './lists'

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    listSemanticRule,
    [
      {
        name: 'items inside a list',
        html: '<ul><li>Arroz</li><li>Feijão</li></ul>',
        expected: 'pass',
      },
      {
        name: 'items inside a menu',
        html: '<menu><li><button>Copiar</button></li></menu>',
        expected: 'pass',
      },
      {
        name: 'list item outside any list',
        html: '<div><li>Arroz</li></div>',
        expected: 'finding',
      },
      { name: 'empty list', html: '<ol></ol>', expected: 'finding' },
    ],
  ],
]
