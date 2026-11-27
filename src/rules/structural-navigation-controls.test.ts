import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import {
  buttonConsistencyRule,
  buttonPurposeRule,
  buttonUsageRule,
  contextChangeOnFocusRule,
  contextChangeOnInputRule,
  dragMovementRule,
  helpConsistencyRule,
  linkPurposeRule,
  linkUsageRule,
  listUsageRule,
  motionOperationRule,
  navigationConsistencyRule,
  pointerGestureRule,
  regionUsageRule,
  singlePointerRule,
  tableUsageRule,
} from './structural-navigation-controls'

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    regionUsageRule,
    [
      {
        name: 'page divided into regions',
        html: '<header>Topo</header><main>Conteúdo</main>',
        expected: 'pass',
      },
      { name: 'page without regions', html: '<div>Conteúdo</div>', expected: 'review' },
    ],
  ],
  [
    listUsageRule,
    [
      {
        name: 'real list',
        html: '<ul><li>Arroz</li><li>Feijão</li><li>Milho</li></ul>',
        expected: 'pass',
      },
      {
        name: 'paragraphs drawn as a bulleted list',
        html: '<div><p>• Arroz</p><p>• Feijão</p><p>• Milho</p></div>',
        expected: 'review',
      },
    ],
  ],
  [
    tableUsageRule,
    [
      {
        name: 'data table with headers',
        html: '<table><tr><th scope="col">Item</th></tr><tr><td>Arroz</td></tr></table>',
        expected: 'pass',
      },
      {
        name: 'table used to lay out links',
        html: '<table><tr><td><a href="/a">A</a></td><td><a href="/b">B</a></td></tr></table>',
        expected: 'review',
      },
    ],
  ],
  [
    linkUsageRule,
    [
      { name: 'link to a page', html: '<a href="/contato">Contato</a>', expected: 'pass' },
      { name: 'link that goes nowhere', html: '<a href="#">Abrir menu</a>', expected: 'review' },
    ],
  ],
  [
    linkPurposeRule,
    [
      {
        name: 'descriptive link',
        html: '<a href="/precos">Ver tabela de preços</a>',
        expected: 'pass',
      },
      { name: 'vague link', html: '<a href="/precos">Saiba mais</a>', expected: 'review' },
    ],
  ],
  [
    navigationConsistencyRule,
    [
      {
        name: 'repeated navigation with the same links',
        html: '<nav><a href="/">Início</a><a href="/contato">Contato</a></nav><nav><a href="/">Início</a><a href="/contato">Contato</a></nav>',
        expected: 'pass',
      },
      {
        name: 'repeated navigation with different links',
        html: '<nav><a href="/">Início</a><a href="/contato">Contato</a></nav><nav><a href="/">Início</a></nav>',
        expected: 'review',
      },
    ],
  ],
  [
    helpConsistencyRule,
    [
      { name: 'one help link', html: '<a href="/ajuda">Ajuda</a>', expected: 'pass' },
      {
        name: 'help offered under different names',
        html: '<a href="/ajuda">Ajuda</a><button>Fale com o suporte</button>',
        expected: 'review',
      },
    ],
  ],
  [
    buttonUsageRule,
    [
      { name: 'button for an action', html: '<button>Abrir menu</button>', expected: 'pass' },
      {
        name: 'link used as a button',
        html: '<a href="#" onclick="return false">Abrir menu</a>',
        expected: 'review',
      },
    ],
  ],
  [
    buttonPurposeRule,
    [
      {
        name: 'button that says what it does',
        html: '<button>Salvar rascunho</button>',
        expected: 'pass',
      },
      { name: 'vague button', html: '<button>Ok</button>', expected: 'review' },
    ],
  ],
  [
    buttonConsistencyRule,
    [
      {
        name: 'same destination with the same name',
        html: '<a href="/carrinho">Carrinho</a><a href="/carrinho">Carrinho</a>',
        expected: 'pass',
      },
      {
        name: 'same destination with different names',
        html: '<a href="/carrinho">Carrinho</a><a href="/carrinho">Minha sacola</a>',
        expected: 'review',
      },
    ],
  ],
  [
    contextChangeOnFocusRule,
    [
      {
        name: 'field without focus behaviour',
        html: '<input aria-label="Busca">',
        expected: 'pass',
      },
      {
        name: 'field with a focus handler',
        html: '<input aria-label="Busca" onfocus="void 0">',
        expected: 'review',
      },
    ],
  ],
  [
    contextChangeOnInputRule,
    [
      {
        name: 'select without change handler',
        html: '<select aria-label="Idioma"><option>PT</option></select>',
        expected: 'pass',
      },
      {
        name: 'select that acts on change',
        html: '<select aria-label="Idioma" onchange="void 0"><option>PT</option></select>',
        expected: 'review',
      },
    ],
  ],
  [
    singlePointerRule,
    [
      {
        name: 'click handler only',
        html: '<button onclick="void 0">Abrir</button>',
        expected: 'pass',
      },
      {
        name: 'action on pointer down',
        html: '<button onpointerdown="void 0">Abrir</button>',
        expected: 'review',
      },
    ],
  ],
  [
    pointerGestureRule,
    [
      { name: 'no gesture handlers', html: '<div>Galeria</div>', expected: 'pass' },
      {
        name: 'swipe gallery',
        html: '<div ontouchmove="void 0">Galeria</div>',
        expected: 'review',
      },
    ],
  ],
  [
    dragMovementRule,
    [
      { name: 'list without drag and drop', html: '<ul><li>Tarefa</li></ul>', expected: 'pass' },
      {
        name: 'draggable item',
        html: '<ul><li draggable="true">Tarefa</li></ul>',
        expected: 'review',
      },
    ],
  ],
  [
    motionOperationRule,
    [
      { name: 'no motion controls', html: '<button>Desfazer</button>', expected: 'pass' },
      {
        name: 'undo by shaking the device',
        html: '<div data-shake="desfazer">Agite para desfazer</div>',
        expected: 'review',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)
