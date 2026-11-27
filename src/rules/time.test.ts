import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import { refreshControlRule, timeLimitRule } from './time'

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    timeLimitRule,
    [
      {
        name: 'timer that does not announce a time limit',
        html: '<div role="timer">Atualizado às 10h</div>',
        expected: 'pass',
      },
      {
        name: 'hidden session warning',
        html: '<div class="session-timeout" hidden>Sua sessão expira em 2 minutos</div>',
        expected: 'pass',
      },
      {
        name: 'session expiry countdown',
        html: '<div class="session-timeout">Sua sessão expira em 2 minutos</div>',
        expected: 'review',
      },
    ],
  ],
  [
    refreshControlRule,
    [
      { name: 'page without automatic refresh', html: '<p>Notícias</p>', expected: 'pass' },
      {
        // A day-long delay, so the browser never actually reloads the test page.
        name: 'page that refreshes itself',
        html: '<meta http-equiv="refresh" content="86400"><p>Notícias</p>',
        expected: 'review',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)
