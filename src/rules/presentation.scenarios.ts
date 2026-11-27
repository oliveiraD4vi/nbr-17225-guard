import type { Rule } from '@/types'
import { replaceInHead, type RuleScenario } from '../../tests/rules/audit-markup'
import { responsiveDesignRule } from './presentation'

const viewport = 'meta[name="viewport"]'

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    responsiveDesignRule,
    [
      {
        name: 'viewport that follows the device width',
        html: '<p>Conteúdo</p>',
        setup: replaceInHead(
          viewport,
          '<meta name="viewport" content="width=device-width, initial-scale=1">',
        ),
        expected: 'pass',
      },
      {
        name: 'fixed-width viewport',
        html: '<p>Conteúdo</p>',
        setup: replaceInHead(viewport, '<meta name="viewport" content="width=1024">'),
        expected: 'finding',
      },
      {
        name: 'no viewport declaration',
        html: '<p>Conteúdo</p>',
        setup: replaceInHead(viewport, ''),
        expected: 'finding',
      },
    ],
  ],
]
