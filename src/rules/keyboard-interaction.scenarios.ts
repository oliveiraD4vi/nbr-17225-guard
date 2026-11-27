import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import {
  additionalContentDismissibleRule,
  additionalContentPersistentRule,
  customComponentInstructionsRule,
  focusFullyVisibleRule,
  focusIndicatorRule,
  focusOrderRule,
  focusPartiallyVisibleRule,
  focusTrapRule,
  keyboardAccessibilityRule,
  keyboardShortcutRule,
} from './keyboard-interaction'

/** Focuses #alvo for the duration of the scenario. */
function focusTarget(document: Document) {
  const target = document.getElementById('alvo') as HTMLElement
  target.focus()
  return () => target.blur()
}

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    keyboardAccessibilityRule,
    [
      { name: 'native button', html: '<button>Salvar</button>', expected: 'pass' },
      {
        name: 'custom button reachable by keyboard',
        html: '<div role="button" tabindex="0">Salvar</div>',
        expected: 'pass',
      },
      {
        name: 'custom button out of the tab order',
        html: '<div role="button">Salvar</div>',
        expected: 'finding',
      },
    ],
  ],
  [
    focusIndicatorRule,
    [
      {
        name: 'focused button with the default outline',
        html: '<button id="alvo">Salvar</button>',
        setup: focusTarget,
        expected: 'pass',
      },
      {
        name: 'focused button with a custom ring',
        html: '<button id="alvo" style="outline: none; box-shadow: 0 0 0 3px #1d4ed8">Salvar</button>',
        setup: focusTarget,
        expected: 'pass',
      },
      {
        name: 'focused button with the indicator removed',
        html: '<button id="alvo" style="outline: none; border: 0; box-shadow: none">Salvar</button>',
        setup: focusTarget,
        expected: 'review',
      },
    ],
  ],
  [
    focusFullyVisibleRule,
    [
      {
        name: 'focused button in view',
        html: '<button id="alvo">Salvar</button>',
        setup: focusTarget,
        expected: 'pass',
      },
      {
        name: 'focused button partly under the top edge',
        html: '<button id="alvo" style="position: fixed; top: -12px; left: 8px; height: 40px">Salvar</button>',
        setup: focusTarget,
        expected: 'review',
      },
    ],
  ],
  [
    focusPartiallyVisibleRule,
    [
      {
        name: 'focused button partly in view',
        html: '<button id="alvo" style="position: fixed; top: -12px; left: 8px; height: 40px">Salvar</button>',
        setup: focusTarget,
        expected: 'pass',
      },
      {
        name: 'focused button out of view',
        html: '<button id="alvo" style="position: fixed; top: -200px; left: 8px">Salvar</button>',
        setup: focusTarget,
        expected: 'review',
      },
    ],
  ],
  [
    focusOrderRule,
    [
      {
        name: 'natural tab order',
        html: '<button>Um</button><button>Dois</button>',
        expected: 'pass',
      },
      {
        name: 'positive tabindex',
        html: '<button>Um</button><button tabindex="1">Dois</button>',
        expected: 'review',
      },
    ],
  ],
  [
    focusTrapRule,
    [
      {
        name: 'dialog with a close button',
        html: '<div role="dialog" aria-label="Aviso"><p>Sessão salva.</p><button>Fechar</button></div>',
        expected: 'pass',
      },
      {
        name: 'dialog without a way out',
        html: '<div role="dialog" aria-label="Aviso"><p>Sessão salva.</p><button>Ok, entendi</button></div>',
        expected: 'review',
      },
    ],
  ],
  [
    additionalContentPersistentRule,
    [
      {
        name: 'tooltip referenced by its trigger',
        html: '<button aria-describedby="dica">Salvar</button><div role="tooltip" id="dica">Grava o rascunho</div>',
        expected: 'pass',
      },
      {
        name: 'tooltip not tied to any trigger',
        html: '<button>Salvar</button><div role="tooltip">Grava o rascunho</div>',
        expected: 'review',
      },
    ],
  ],
  [
    additionalContentDismissibleRule,
    [
      {
        name: 'popover with a close button',
        html: '<div popover="manual" id="ajuda"><p>Ajuda</p><button aria-label="Fechar ajuda">×</button></div>',
        expected: 'pass',
      },
      {
        name: 'popover without a way to dismiss it',
        html: '<div popover="manual" id="ajuda"><p>Ajuda</p></div>',
        expected: 'review',
      },
    ],
  ],
  [
    keyboardShortcutRule,
    [
      { name: 'no keyboard shortcuts', html: '<button>Buscar</button>', expected: 'pass' },
      {
        name: 'single-key access key',
        html: '<button accesskey="b">Buscar</button>',
        expected: 'review',
      },
    ],
  ],
  [
    customComponentInstructionsRule,
    [
      {
        name: 'slider with keyboard instructions',
        html: '<section><p>Use as setas para ajustar o volume.</p><div role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5" tabindex="0" style="width: 120px; height: 8px"></div></section>',
        expected: 'pass',
      },
      {
        name: 'native select',
        html: '<label>Estado <select><option>CE</option></select></label>',
        expected: 'pass',
      },
      {
        name: 'slider without instructions',
        html: '<section><p>Volume da campainha.</p><div role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5" tabindex="0" style="width: 120px; height: 8px"></div></section>',
        expected: 'review',
      },
    ],
  ],
]
