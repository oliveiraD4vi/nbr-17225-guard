import type { Rule } from '@/types'
import { replaceInHead, type RuleScenario } from '../../tests/rules/audit-markup'
import {
  accessibleNameRule,
  customStateRule,
  frameTitleRule,
  identifiablePurposeRule,
  nativeElementsRule,
  pageLanguageRule,
  pageTitleRule,
  zoomAllowedRule,
} from './semantics'

const viewport = 'meta[name="viewport"]'

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    pageTitleRule,
    [
      { name: 'page with a title', html: '<p>Conteúdo</p>', expected: 'pass' },
      {
        name: 'page without a title',
        html: '<p>Conteúdo</p>',
        setup: (document) => {
          document.title = ''
          return () => undefined
        },
        expected: 'finding',
      },
    ],
  ],
  [
    pageLanguageRule,
    [
      { name: 'page in pt-BR', html: '<p>Conteúdo</p>', expected: 'pass' },
      {
        name: 'page without a language',
        html: '<p>Conteúdo</p>',
        setup: (document) => {
          document.documentElement.removeAttribute('lang')
          return () => undefined
        },
        expected: 'finding',
      },
      {
        name: 'invalid language tag',
        html: '<p>Conteúdo</p>',
        setup: (document) => {
          document.documentElement.setAttribute('lang', 'português')
          return () => undefined
        },
        expected: 'finding',
      },
    ],
  ],
  [
    frameTitleRule,
    [
      {
        name: 'frame with a title',
        html: '<iframe title="Mapa da unidade" srcdoc="<p>Mapa</p>"></iframe>',
        expected: 'pass',
      },
      {
        name: 'frame without a title',
        html: '<iframe srcdoc="<p>Mapa</p>"></iframe>',
        expected: 'finding',
      },
    ],
  ],
  [
    zoomAllowedRule,
    [
      {
        name: 'zoomable viewport',
        html: '<p>Conteúdo</p>',
        setup: replaceInHead(
          viewport,
          '<meta name="viewport" content="width=device-width, initial-scale=1">',
        ),
        expected: 'pass',
      },
      {
        name: 'viewport that blocks zoom',
        html: '<p>Conteúdo</p>',
        setup: replaceInHead(
          viewport,
          '<meta name="viewport" content="width=device-width, user-scalable=no">',
        ),
        expected: 'finding',
      },
      {
        name: 'viewport that caps zoom at 1',
        html: '<p>Conteúdo</p>',
        setup: replaceInHead(
          viewport,
          '<meta name="viewport" content="width=device-width, maximum-scale=1">',
        ),
        expected: 'finding',
      },
    ],
  ],
  [
    accessibleNameRule,
    [
      {
        name: 'named controls',
        html: '<button>Enviar</button><label>E-mail <input type="email"></label>',
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
    identifiablePurposeRule,
    [
      {
        name: 'e-mail field with autocomplete',
        html: '<label>E-mail <input type="email" autocomplete="email"></label>',
        expected: 'pass',
      },
      {
        name: 'field with no recognisable purpose',
        html: '<label>Comentário <input type="text"></label>',
        expected: 'pass',
      },
      {
        name: 'e-mail field without autocomplete',
        html: '<label>E-mail <input type="email"></label>',
        expected: 'review',
      },
    ],
  ],
  [
    nativeElementsRule,
    [
      { name: 'native button', html: '<button>Salvar</button>', expected: 'pass' },
      {
        name: 'div acting as a button',
        html: '<div role="button" tabindex="0">Salvar</div>',
        expected: 'review',
      },
    ],
  ],
  [
    customStateRule,
    [
      {
        name: 'custom checkbox exposing its state',
        html: '<div role="checkbox" aria-checked="false" tabindex="0">Aceito</div>',
        expected: 'pass',
      },
      {
        name: 'custom checkbox without its state',
        html: '<div role="checkbox" tabindex="0">Aceito</div>',
        expected: 'finding',
      },
      {
        name: 'combobox without expanded state',
        html: '<input role="combobox" aria-label="Cidade">',
        expected: 'finding',
      },
    ],
  ],
]
