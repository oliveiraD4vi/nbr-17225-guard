import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import { audioControlRule } from './media'

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    audioControlRule,
    [
      { name: 'audio that waits for the user', html: '<audio controls></audio>', expected: 'pass' },
      {
        name: 'autoplaying audio with controls',
        html: '<audio autoplay muted controls></audio>',
        expected: 'pass',
      },
      {
        name: 'autoplaying video without controls',
        html: '<video autoplay muted></video>',
        expected: 'finding',
      },
    ],
  ],
]
