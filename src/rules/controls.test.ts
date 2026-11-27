import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import { buttonSemanticRule, enhancedTargetSizeRule, targetSizeRule } from './controls'

const button = (size: number, label = 'Salvar') =>
  `<button aria-label="${label}" style="width: ${size}px; height: ${size}px; padding: 0; margin: 0"></button>`

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    buttonSemanticRule,
    [
      { name: 'button with text', html: '<button>Salvar</button>', expected: 'pass' },
      {
        name: 'input button with a value',
        html: '<input type="submit" value="Enviar">',
        expected: 'pass',
      },
      {
        name: 'icon button without a name',
        html: '<button><svg aria-hidden="true" width="16" height="16"></svg></button>',
        expected: 'finding',
      },
    ],
  ],
  [
    targetSizeRule,
    [
      { name: '24px button', html: button(24), expected: 'pass' },
      {
        name: 'small button with room around it',
        html: `<div style="padding: 24px">${button(16)}</div>`,
        expected: 'pass',
      },
      {
        name: 'link inside a sentence',
        html: '<p>Leia a <a href="/politica">política</a> antes de continuar.</p>',
        expected: 'pass',
      },
      {
        name: 'two small buttons touching',
        html: `<div style="display: flex">${button(16, 'Anterior')}${button(16, 'Próximo')}</div>`,
        expected: 'finding',
      },
    ],
  ],
  [
    enhancedTargetSizeRule,
    [
      { name: '44px button', html: button(44), expected: 'pass' },
      {
        name: 'lone 30px button',
        html: `<div style="padding: 44px">${button(30)}</div>`,
        expected: 'finding',
      },
      {
        name: 'two 30px buttons side by side',
        html: `<div style="display: flex">${button(30, 'Anterior')}${button(30, 'Próximo')}</div>`,
        expected: 'finding',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)
