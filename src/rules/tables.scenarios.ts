import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import { tableCaptionRule, tableHeadersRule, tableSemanticRule } from './tables'

const dataTable = (headerAttributes: string, caption = '<caption>Horários</caption>') => `
  <table>
    ${caption}
    <tr><th ${headerAttributes}>Dia</th><th ${headerAttributes}>Abertura</th></tr>
    <tr><td>Segunda</td><td>8h</td></tr>
  </table>`

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    tableSemanticRule,
    [
      { name: 'cells inside a table', html: dataTable('scope="col"'), expected: 'pass' },
      {
        name: 'table markup outside a table',
        html: '<div><template id="x"></template></div><div role="row"></div>',
        setup: (document) => {
          // The HTML parser drops stray <td>, so the orphan cell is created through the DOM.
          document.body.append(document.createElement('td'))
          return () => undefined
        },
        expected: 'finding',
      },
    ],
  ],
  [
    tableHeadersRule,
    [
      { name: 'headers with scope', html: dataTable('scope="col"'), expected: 'pass' },
      {
        name: 'layout table without data cells',
        html: '<table><tr><th>Menu</th></tr></table>',
        expected: 'pass',
      },
      {
        name: 'data table without header cells',
        html: '<table><caption>Horários</caption><tr><td>Segunda</td><td>8h</td></tr></table>',
        expected: 'finding',
      },
      {
        // Browsers infer these headers in a simple table; the rule still asks for scope or id.
        name: 'header cells without scope or id',
        html: dataTable(''),
        expected: 'finding',
      },
    ],
  ],
  [
    tableCaptionRule,
    [
      { name: 'table with a caption', html: dataTable('scope="col"'), expected: 'pass' },
      {
        name: 'table named by aria-label',
        html: dataTable('scope="col"', '').replace('<table>', '<table aria-label="Horários">'),
        expected: 'pass',
      },
      {
        name: 'data table without a name',
        html: dataTable('scope="col"', ''),
        expected: 'finding',
      },
    ],
  ],
]
