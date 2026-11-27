import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import {
  externalLinkRule,
  linkSemanticRule,
  locationAlternativesRule,
  newWindowLinkRule,
  nonHtmlFileLinkRule,
  skipLinksRule,
} from './navigation'

const siteNavigation = `<nav aria-label="Principal">${['Início', 'Serviços', 'Notícias', 'Contato']
  .map((label, index) => `<a href="/pagina-${index}">${label}</a>`)
  .join(' ')}</nav>`

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    linkSemanticRule,
    [
      {
        name: 'named link with a destination',
        html: '<a href="/contato">Contato</a>',
        expected: 'pass',
      },
      {
        name: 'icon link named by screen-reader-only text',
        html: '<a href="/contato"><span aria-hidden="true">→</span><span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Contato</span></a>',
        expected: 'pass',
      },
      { name: 'link without a destination', html: '<a>Contato</a>', expected: 'finding' },
      {
        name: 'link without a name',
        html: '<a href="/contato"><span aria-hidden="true">→</span></a>',
        expected: 'finding',
      },
    ],
  ],
  [
    skipLinksRule,
    [
      {
        name: 'skip link to the main content',
        html: '<a href="#conteudo">Pular para o conteúdo</a><main id="conteudo"></main>',
        expected: 'pass',
      },
      {
        name: 'page without a skip link',
        html: '<a href="/contato">Contato</a><main></main>',
        expected: 'finding',
      },
    ],
  ],
  [
    locationAlternativesRule,
    [
      {
        name: 'site navigation with a search form',
        html: `${siteNavigation}<form role="search"><input type="search" aria-label="Buscar no site"></form>`,
        expected: 'pass',
      },
      {
        name: 'site navigation with a breadcrumb',
        html: `${siteNavigation}<nav aria-label="Trilha"><a href="/">Início</a></nav>`,
        expected: 'pass',
      },
      { name: 'page without site navigation', html: '<p>Conteúdo</p>', expected: 'pass' },
      {
        name: 'site navigation as the only way to find pages',
        html: siteNavigation,
        expected: 'review',
      },
    ],
  ],
  [
    newWindowLinkRule,
    [
      {
        name: 'new window link that says so',
        html: '<a href="https://example.com/manual" target="_blank">Manual (abre em nova guia)</a>',
        expected: 'pass',
      },
      {
        name: 'new window link that does not warn',
        html: '<a href="https://example.com/manual" target="_blank">Manual</a>',
        expected: 'review',
      },
    ],
  ],
  [
    nonHtmlFileLinkRule,
    [
      {
        name: 'file link that names the format',
        html: '<a href="/relatorio.pdf">Relatório anual (PDF)</a>',
        expected: 'pass',
      },
      {
        name: 'file link that hides the format',
        html: '<a href="/relatorio.pdf">Relatório anual</a>',
        expected: 'review',
      },
    ],
  ],
  [
    externalLinkRule,
    [
      { name: 'internal link', html: '<a href="/contato">Contato</a>', expected: 'pass' },
      {
        name: 'external link that names its destination',
        html: '<a href="https://www.gov.br/saude">Ministério da Saúde em gov.br/saude</a>',
        expected: 'pass',
      },
      {
        name: 'external link that looks internal',
        html: '<a href="https://www.gov.br/saude">Ministério da Saúde</a>',
        expected: 'review',
      },
    ],
  ],
]
