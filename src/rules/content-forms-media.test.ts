import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import * as rules from './content-forms-media'

const longText =
  'O Guardião organiza cada violação com referência normativa, severidade, elemento afetado e evidência observada na página auditada.'

function focusTarget(document: Document) {
  const target = document.getElementById('alvo') as HTMLElement
  target.focus()
  return () => target.blur()
}

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    rules.predictableFieldLabelRule,
    [
      {
        name: 'same purpose with the same label',
        html: '<label>E-mail <input autocomplete="email"></label><label>E-mail <input autocomplete="email"></label>',
        expected: 'pass',
      },
      {
        name: 'same purpose with different labels',
        html: '<label>E-mail <input autocomplete="email"></label><label>Correio eletrônico <input autocomplete="email"></label>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.descriptiveFieldLabelRule,
    [
      { name: 'descriptive label', html: '<label>Nome completo <input></label>', expected: 'pass' },
      { name: 'generic label', html: '<label>Campo <input></label>', expected: 'review' },
    ],
  ],
  [
    rules.predictableHelpTextRule,
    [
      {
        name: 'password field with help',
        html: '<label>Senha <input type="password" aria-describedby="dica"></label><p id="dica">Mínimo de 8 caracteres.</p>',
        expected: 'pass',
      },
      {
        name: 'password field without help',
        html: '<label>Senha <input type="password"></label>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.descriptiveErrorRule,
    [
      {
        name: 'error that explains the problem',
        html: '<p role="alert">Informe o e-mail no formato nome@exemplo.com.</p>',
        expected: 'pass',
      },
      { name: 'bare error', html: '<p role="alert">Erro</p>', expected: 'review' },
    ],
  ],
  [
    rules.correctionSuggestionRule,
    [
      {
        name: 'error with a correction',
        html: '<p role="alert">Use o formato DD/MM/AAAA.</p>',
        expected: 'pass',
      },
      {
        name: 'error without a correction',
        html: '<p role="alert">Data incorreta.</p>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.criticalFormPreventionRule,
    [
      {
        name: 'payment with a review step',
        html: '<form><a href="/carrinho">Revisar pedido</a><button>Pagar</button></form>',
        expected: 'pass',
      },
      {
        name: 'payment without review',
        html: '<form><button>Pagar</button></form>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.dataReentryRule,
    [
      {
        name: 'each datum asked once',
        html: '<label>Nome <input></label><label>E-mail <input></label>',
        expected: 'pass',
      },
      {
        name: 'same datum asked twice',
        html: '<label>E-mail <input></label><label>E-mail <input></label>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.sensoryValidationRule,
    [
      { name: 'instruction by name', html: '<p>Clique em Continuar.</p>', expected: 'pass' },
      {
        name: 'instruction by colour',
        html: '<p>Clique no círculo verde para continuar.</p>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.sensoryCharacteristicsRule,
    [
      { name: 'instruction by name', html: '<p>Use o botão Enviar.</p>', expected: 'pass' },
      {
        name: 'instruction by colour and shape',
        html: '<p>Clique no botão vermelho.</p>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.presentationOrderRule,
    [
      {
        name: 'source order',
        html: '<div style="display: flex"><button>Um</button><button>Dois</button></div>',
        expected: 'pass',
      },
      { name: 'positive tabindex', html: '<button tabindex="2">Um</button>', expected: 'review' },
      {
        // `order` moves a flex item; it is set on the item, not on the container.
        name: 'flex item moved with order',
        html: '<div style="display: flex"><button style="order: 2">Um</button><button>Dois</button></div>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.orientationRule,
    [
      { name: 'layout for every orientation', html: '<main>Conteúdo</main>', expected: 'pass' },
      {
        name: 'content hidden in one orientation',
        html: '<style>@media (orientation: landscape) { main { display: none } }</style><main>Conteúdo</main>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.colorUsageRule,
    [
      {
        name: 'required fields marked with text',
        html: '<p>Campos com * são obrigatórios.</p>',
        expected: 'pass',
      },
      {
        name: 'required fields marked by colour',
        html: '<p>Os campos em vermelho são obrigatórios.</p>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.graphicContrastRule,
    [
      {
        name: 'dark icon',
        html: '<div style="background: #ffffff"><svg width="40" height="40" style="fill: #000000"><rect width="40" height="40"/></svg></div>',
        expected: 'pass',
      },
      {
        name: 'faint icon',
        html: '<div style="background: #ffffff"><svg width="40" height="40" style="fill: #dddddd"><rect width="40" height="40"/></svg></div>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.focusIndicatorContrastRule,
    [
      {
        name: 'dark focus outline',
        html: '<div style="background: #ffffff"><button id="alvo" style="outline: 2px solid #000000">Salvar</button></div>',
        setup: focusTarget,
        expected: 'pass',
      },
      {
        name: 'faint focus outline',
        html: '<div style="background: #ffffff"><button id="alvo" style="outline: 2px solid #eeeeee">Salvar</button></div>',
        setup: focusTarget,
        expected: 'review',
      },
    ],
  ],
  [
    rules.lineSpacingRule,
    [
      {
        name: 'paragraph free to grow',
        html: `<p style="line-height: 1.2; width: 200px">${longText}</p>`,
        expected: 'pass',
      },
      {
        name: 'tight paragraph clipped by its height',
        html: `<p style="line-height: 1.2; width: 200px; max-height: 20px; overflow: hidden">${longText}</p>`,
        expected: 'review',
      },
    ],
  ],
  [
    rules.paragraphSpacingRule,
    [
      {
        name: 'paragraphs free to grow',
        html: `<div><p>${longText}</p><p>${longText}</p></div>`,
        expected: 'pass',
      },
      {
        name: 'paragraphs clipped by their container',
        html: `<div style="max-height: 40px; overflow: hidden"><p>${longText}</p><p>${longText}</p></div>`,
        expected: 'review',
      },
    ],
  ],
  [
    rules.letterSpacingRule,
    [
      { name: 'wrapping text', html: `<p>${longText}</p>`, expected: 'pass' },
      {
        name: 'text forced onto one line',
        html: `<p style="white-space: nowrap">${longText}</p>`,
        expected: 'review',
      },
    ],
  ],
  [
    rules.wordSpacingRule,
    [
      { name: 'wrapping text', html: `<p>${longText}</p>`, expected: 'pass' },
      {
        name: 'text forced onto one line',
        html: `<p style="white-space: nowrap">${longText}</p>`,
        expected: 'review',
      },
    ],
  ],
  [
    rules.textWidthRule,
    [
      {
        name: 'readable line length',
        html: `<p style="width: 600px">${longText} ${longText}</p>`,
        expected: 'pass',
      },
      {
        name: 'very long lines',
        html: `<p style="width: 1000px">${longText} ${longText}</p>`,
        expected: 'review',
      },
    ],
  ],
  [
    rules.resizedTextRule,
    [
      { name: 'text that can grow', html: `<p>${longText}</p>`, expected: 'pass' },
      {
        name: 'text locked to a fixed height',
        html: `<p style="height: 20px; overflow: hidden; white-space: nowrap">${longText}</p>`,
        expected: 'review',
      },
    ],
  ],
  [
    rules.pagePartLanguageRule,
    [
      {
        name: 'English passage marked with lang',
        html: '<p lang="en">Read the privacy policy and the terms of service for your account.</p>',
        expected: 'pass',
      },
      {
        name: 'English passage without lang',
        html: '<p>Read the privacy policy and the terms of service for your account.</p>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.readingOrderRule,
    [
      { name: 'source order', html: '<p>Um</p><p>Dois</p>', expected: 'pass' },
      {
        name: 'author-defined reading order',
        html: '<p aria-flowto="dois">Um</p><p id="dois">Dois</p>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.visibleTextInNameRule,
    [
      {
        name: 'name that starts with the visible text',
        html: '<button aria-label="Salvar rascunho">Salvar</button>',
        expected: 'pass',
      },
      {
        name: 'name that differs from the visible text',
        html: '<button aria-label="Enviar formulário">Salvar</button>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.statusMessageRule,
    [
      {
        name: 'status announced to assistive technology',
        html: '<div class="toast" role="status">Rascunho salvo</div>',
        expected: 'pass',
      },
      {
        name: 'silent status message',
        html: '<div class="toast">Rascunho salvo</div>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.customComponentSemanticRule,
    [
      {
        name: 'custom control with a role',
        html: '<div role="button" tabindex="0">Abrir</div>',
        expected: 'pass',
      },
      {
        name: 'custom control without a role',
        html: '<div tabindex="0" onclick="void 0">Abrir</div>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.audioTranscriptRule,
    [
      {
        name: 'audio with a transcript',
        html: '<figure><audio controls></audio><a href="/transcricao">Transcrição do episódio</a></figure>',
        expected: 'pass',
      },
      {
        name: 'audio alone',
        html: '<figure><audio controls></audio></figure>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.videoTranscriptRule,
    [
      {
        name: 'video with a transcript',
        html: '<figure><video width="320" height="180"></video><a href="/transcricao">Transcrição do vídeo</a></figure>',
        expected: 'pass',
      },
      {
        name: 'video alone',
        html: '<figure><video width="320" height="180"></video></figure>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.videoCaptionsRule,
    [
      {
        name: 'video with captions',
        html: '<video width="320" height="180"><track kind="captions" srclang="pt" src="data:text/vtt,WEBVTT"></video>',
        expected: 'pass',
      },
      {
        name: 'video without captions',
        html: '<video width="320" height="180"></video>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.audioDescriptionRule,
    [
      {
        name: 'video with audio description',
        html: '<video width="320" height="180"><track kind="descriptions" srclang="pt" src="data:text/vtt,WEBVTT"></video>',
        expected: 'pass',
      },
      {
        name: 'video without audio description',
        html: '<video width="320" height="180"></video>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.liveCaptionsRule,
    [
      { name: 'recorded content', html: '<p>Notícias da semana</p>', expected: 'pass' },
      {
        name: 'live broadcast with captions',
        html: '<div>Transmissão ao vivo com legendas</div>',
        expected: 'pass',
      },
      {
        name: 'live broadcast without captions',
        html: '<div>Transmissão ao vivo</div>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.animationControlRule,
    [
      {
        name: 'carousel with a pause button',
        html: '<section><div class="carousel">Slides</div><button>Pausar</button></section>',
        expected: 'pass',
      },
      {
        name: 'carousel without a pause button',
        html: '<section><div class="carousel">Slides</div></section>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.flashingContentRule,
    [
      {
        name: 'slow animation',
        html: '<style>@keyframes pulso { to { opacity: 0.4 } }</style><div class="animation" style="width: 100px; height: 100px; animation: pulso 2s infinite">Novo</div>',
        expected: 'pass',
      },
      {
        name: 'large area flashing several times a second',
        html: '<style>@keyframes pulso { to { opacity: 0.4 } }</style><div class="animation" style="width: 100px; height: 100px; animation: pulso 0.1s infinite">Novo</div>',
        expected: 'review',
      },
    ],
  ],
  [
    rules.adjustableTimeLimitRule,
    [
      {
        name: 'expiry notice with a way to extend it',
        html: '<div><p>Sua sessão expira em 2 minutos.</p><button>Renovar sessão</button></div>',
        expected: 'pass',
      },
      {
        name: 'expiry notice without a way to extend it',
        html: '<div><p>Sua sessão expira em 2 minutos.</p></div>',
        expected: 'review',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)
