import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import { componentContrastRule, enhancedTextContrastRule, textContrastRule } from './colors'

// Contrast against white: #000000 21:1, #595959 7:1, #767676 4.54:1, #949494 3.03:1, #aaaaaa 2.32:1.
const onWhite = (style: string, text = 'Horário de atendimento') =>
  `<div style="background: #ffffff"><p style="${style}">${text}</p></div>`

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    textContrastRule,
    [
      {
        name: 'black body text',
        html: onWhite('color: #000000; font-size: 16px'),
        expected: 'pass',
      },
      {
        name: 'light grey body text',
        html: onWhite('color: #aaaaaa; font-size: 16px'),
        expected: 'finding',
      },
      {
        name: '24px text at 3:1',
        html: onWhite('color: #949494; font-size: 24px'),
        expected: 'pass',
      },
      {
        name: '19px bold text at 3:1',
        html: onWhite('color: #949494; font-size: 19px; font-weight: 700'),
        expected: 'pass',
      },
      {
        // 20px is 15pt: not large text, so it still needs 4.5:1.
        name: '20px regular text at 3:1',
        html: onWhite('color: #949494; font-size: 20px'),
        expected: 'finding',
      },
    ],
  ],
  [
    enhancedTextContrastRule,
    [
      {
        name: 'body text at 7:1',
        html: onWhite('color: #595959; font-size: 16px'),
        expected: 'pass',
      },
      {
        name: 'body text at 4.54:1',
        html: onWhite('color: #767676; font-size: 16px'),
        expected: 'finding',
      },
      {
        name: '20px regular text at 4.54:1',
        html: onWhite('color: #767676; font-size: 20px'),
        expected: 'finding',
      },
    ],
  ],
  [
    componentContrastRule,
    [
      {
        name: 'button with a dark border',
        html: '<div style="background: #ffffff"><button style="border: 1px solid #767676; background: #ffffff">Enviar</button></div>',
        expected: 'pass',
      },
      {
        name: 'borderless button',
        html: '<div style="background: #ffffff"><button style="border: 0; background: #ffffff">Enviar</button></div>',
        expected: 'pass',
      },
      {
        name: 'input with a faint border',
        html: '<div style="background: #ffffff"><input aria-label="Nome" style="border: 1px solid #dddddd; background: #ffffff"></div>',
        expected: 'finding',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)
