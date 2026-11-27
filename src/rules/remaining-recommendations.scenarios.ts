import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import * as recommendations from './remaining-recommendations'

/** Recommendations only raise review candidates: one scenario without a candidate, one with. */
function candidate(
  rule: Rule,
  withoutCandidate: string,
  withCandidate: string,
  candidateName: string,
): [Rule, RuleScenario[]] {
  return [
    rule,
    [
      { name: 'nothing to review', html: withoutCandidate, expected: 'pass' },
      { name: candidateName, html: withCandidate, expected: 'review' },
    ],
  ]
}

const longText = (length: number) =>
  'Texto informativo sobre o serviço. '.repeat(Math.ceil(length / 35))
const links = (count: number) =>
  Array.from({ length: count }, (_, index) => `<a href="/p${index}">Página ${index}</a>`).join(' ')
const row = (cells: number) => `<tr>${'<td>valor</td>'.repeat(cells)}</tr>`
const plain = '<p>Conteúdo</p>'

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  candidate(
    recommendations.focusUsageRecommendationRule,
    plain,
    '<input autofocus aria-label="Busca">',
    'field focused on load',
  ),
  candidate(
    recommendations.additionalContentRecommendationRule,
    plain,
    '<button title="Salva o rascunho">Salvar</button>',
    'control with extra content',
  ),
  candidate(
    recommendations.keyboardShortcutsRecommendationRule,
    plain,
    '<button accesskey="s">Salvar</button>',
    'keyboard shortcut',
  ),
  candidate(
    recommendations.fullKeyboardAccessibilityRecommendationRule,
    plain,
    '<button>Salvar</button>',
    'interactive content',
  ),
  candidate(
    recommendations.simultaneousInputRecommendationRule,
    plain,
    '<canvas width="200" height="100"></canvas>',
    'pointer surface',
  ),
  candidate(
    recommendations.customComponentBehaviorRecommendationRule,
    plain,
    '<div role="tablist" aria-label="Seções"><button role="tab">Um</button></div>',
    'custom widget',
  ),
  candidate(
    recommendations.sectionHeadingsRecommendationRule,
    `<section><h2>Serviços</h2><p>${longText(320)}</p></section>`,
    `<section><p>${longText(320)}</p></section>`,
    'long section without a heading',
  ),
  candidate(
    recommendations.uniqueRegionsRecommendationRule,
    '<nav aria-label="Principal"><a href="/">Início</a></nav><nav aria-label="Rodapé"><a href="/">Início</a></nav>',
    '<nav><a href="/">Início</a></nav><nav><a href="/">Início</a></nav>',
    'repeated unnamed region',
  ),
  candidate(
    recommendations.tableTitleRecommendationRule,
    '<table><caption>Horários</caption><tr><td>8h</td></tr></table>',
    '<table><tr><td>8h</td></tr></table>',
    'table without a title',
  ),
  candidate(
    recommendations.complexTableDescriptionRecommendationRule,
    `<table>${row(4).repeat(2)}</table>`,
    `<table>${row(4).repeat(5)}</table>`,
    'large table without a description',
  ),
  candidate(
    recommendations.standaloneLinkPurposeRecommendationRule,
    '<a href="/precos">Tabela de preços</a>',
    '<a href="/precos">Saiba mais</a>',
    'link that needs its context',
  ),
  candidate(
    recommendations.consistentLinkIdentificationRecommendationRule,
    plain,
    '<a href="/contato">Contato</a>',
    'links to compare across pages',
  ),
  candidate(
    recommendations.complementaryLinkTextRecommendationRule,
    '<a href="/contato">Contato</a>',
    '<a href="/contato"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="16" height="16" alt="">Contato</a>',
    'link with an icon',
  ),
  candidate(
    recommendations.adjacentLinksRecommendationRule,
    '<p><a href="/a">Notícia</a> <a href="/b">Outra</a></p>',
    '<p><a href="/a">Foto</a> <a href="/a">Notícia</a></p>',
    'two adjacent links to the same place',
  ),
  candidate(
    recommendations.skipBlockLinksRecommendationRule,
    `<a href="#conteudo">Pular</a>${links(8)}<main id="conteudo"></main>`,
    `${links(8)}<main></main>`,
    'many links before the content without a skip link',
  ),
  candidate(
    recommendations.siteLocationRecommendationRule,
    plain,
    '<nav aria-label="Principal"><a href="/">Início</a></nav>',
    'site navigation',
  ),
  candidate(
    recommendations.pageControlConsistencyRecommendationRule,
    '<button type="button">Salvar</button><button type="button">Salvar</button>',
    '<button type="submit">Salvar</button><button type="button">Salvar</button>',
    'same name for different actions',
  ),
  candidate(
    recommendations.predictableContextChangeRecommendationRule,
    plain,
    '<select aria-label="Idioma" onchange="void 0"><option>PT</option></select>',
    'control that acts on change',
  ),
  candidate(
    recommendations.controlFeedbackRecommendationRule,
    plain,
    '<button>Salvar</button>',
    'control whose feedback needs checking',
  ),
  candidate(
    recommendations.errorPreventionRecommendationRule,
    plain,
    '<form><label>Nome <input></label></form>',
    'form in a journey',
  ),
  candidate(
    recommendations.enhancedAuthenticationRecommendationRule,
    plain,
    '<label>Senha <input type="password"></label>',
    'password field',
  ),
  candidate(
    recommendations.focusIndicatorAreaRecommendationRule,
    plain,
    '<button>Salvar</button>',
    'focusable control',
  ),
  candidate(
    recommendations.definitionsRecommendationRule,
    plain,
    '<p>Use o <code>CPF</code> sem pontos.</p>',
    'technical term',
  ),
  candidate(
    recommendations.readingLevelRecommendationRule,
    `<main><p>${longText(200)}</p></main>`,
    `<main><p>${longText(1300)}</p></main>`,
    'long main text',
  ),
  candidate(
    recommendations.pronunciationRecommendationRule,
    '<p>Bem-vindo ao portal.</p>',
    '<p>Consulte o SUS.</p>',
    'acronym to pronounce',
  ),
  candidate(
    recommendations.extendedAudioDescriptionRecommendationRule,
    plain,
    '<video width="320" height="180"></video>',
    'video',
  ),
  candidate(
    recommendations.signLanguageRecommendationRule,
    plain,
    '<video width="320" height="180"></video>',
    'audiovisual content',
  ),
  candidate(
    recommendations.cleanAudioRecommendationRule,
    plain,
    '<audio controls></audio>',
    'audio',
  ),
  candidate(
    recommendations.liveAudioTranscriptRecommendationRule,
    plain,
    '<div data-live>Transmissão</div>',
    'live broadcast',
  ),
  candidate(
    recommendations.interactionAnimationRecommendationRule,
    plain,
    '<div class="animated-card">Novidade</div>',
    'animated element',
  ),
  candidate(
    recommendations.intermittentFlashRecommendationRule,
    plain,
    '<div class="blink">Promoção</div>',
    'blinking element',
  ),
  candidate(
    recommendations.interruptionsRecommendationRule,
    plain,
    '<div role="dialog" aria-label="Aviso">Atualização disponível</div>',
    'interruption',
  ),
  candidate(
    recommendations.reauthenticationRecommendationRule,
    plain,
    '<div role="alert">Sessão expirada</div>',
    'session that may expire',
  ),
  candidate(
    recommendations.inactivityRecommendationRule,
    plain,
    '<div role="timer">Tempo restante: 2:00</div>',
    'inactivity timer',
  ),
]
