import type { Rule } from '@/types'
import { type RuleScenario } from '../../tests/rules/audit-markup'
import {
  complexImageDescriptionRule,
  imageAltTextRule,
  imageDecorativeRule,
  imageFunctionalAltRule,
  imageMapAltTextRule,
  imageOfTextRule,
} from './images'

const pixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

export const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    imageAltTextRule,
    [
      {
        name: 'image with alt text',
        html: `<img src="${pixel}" width="40" height="40" alt="Foto do produto">`,
        expected: 'pass',
      },
      {
        name: 'image named by aria-label',
        html: `<img src="${pixel}" width="40" height="40" aria-label="Foto do produto">`,
        expected: 'pass',
      },
      {
        name: 'image marked as presentation',
        html: `<img src="${pixel}" width="40" height="40" role="presentation">`,
        expected: 'pass',
      },
      {
        name: 'hidden image without alt',
        html: `<img src="${pixel}" width="40" height="40" hidden>`,
        expected: 'pass',
      },
      {
        name: 'image without any text alternative',
        html: `<img src="${pixel}" width="40" height="40">`,
        expected: 'finding',
      },
    ],
  ],
  [
    imageFunctionalAltRule,
    [
      {
        name: 'link image with alt text',
        html: `<a href="/inicio"><img src="${pixel}" width="40" height="40" alt="Início"></a>`,
        expected: 'pass',
      },
      {
        name: 'button named by aria-label around an image without alt',
        html: `<button aria-label="Fechar"><img src="${pixel}" width="16" height="16"></button>`,
        expected: 'pass',
      },
      {
        name: 'link whose only content is an image without alt',
        html: `<a href="/inicio"><img src="${pixel}" width="40" height="40"></a>`,
        expected: 'finding',
      },
    ],
  ],
  [
    imageDecorativeRule,
    [
      {
        name: 'small decorative icon hidden with empty alt',
        html: `<img class="icon-arrow" src="${pixel}" width="16" height="16" alt="">`,
        expected: 'pass',
      },
      {
        name: 'large image with an icon class',
        html: `<img class="icon-hero" src="${pixel}" width="320" height="180" alt="Equipe reunida">`,
        expected: 'pass',
      },
      {
        name: 'brand logo',
        html: `<img class="icon logo" src="${pixel}" width="32" height="32" alt="Guardião">`,
        expected: 'pass',
      },
      {
        name: 'small decorative icon exposed with alt text',
        html: `<img class="icon-arrow" src="${pixel}" width="16" height="16" alt="seta">`,
        expected: 'review',
      },
    ],
  ],
  [
    complexImageDescriptionRule,
    [
      {
        name: 'chart with a linked description',
        html: `<img class="chart" src="${pixel}" width="320" height="200" alt="Vendas por mês" aria-describedby="vendas"><p id="vendas">Vendas cresceram 12% ao mês.</p>`,
        expected: 'pass',
      },
      {
        name: 'thumbnail of a chart',
        html: `<img class="chart" src="${pixel}" width="60" height="40" alt="Miniatura do gráfico">`,
        expected: 'pass',
      },
      {
        name: 'chart without a longer description',
        html: `<img class="chart" src="${pixel}" width="320" height="200" alt="Vendas por mês">`,
        expected: 'review',
      },
    ],
  ],
  [
    imageOfTextRule,
    [
      {
        name: 'photograph',
        html: `<img class="photo" src="${pixel}" width="320" height="200" alt="Praia ao entardecer">`,
        expected: 'pass',
      },
      {
        name: 'text banner used as a link',
        html: `<a href="/promocao"><img class="banner" src="${pixel}" width="320" height="80" alt="Promoção de verão com 50% de desconto"></a>`,
        expected: 'pass',
      },
      {
        name: 'text banner',
        html: `<img class="banner" src="${pixel}" width="320" height="80" alt="Promoção de verão com 50% de desconto">`,
        expected: 'review',
      },
    ],
  ],
  [
    imageMapAltTextRule,
    [
      {
        name: 'image map area with alt text',
        html: `<map name="mapa"><area href="/norte" shape="rect" coords="0,0,10,10" alt="Região norte"></map>`,
        expected: 'pass',
      },
      {
        name: 'image map area without a name',
        html: `<map name="mapa"><area href="/norte" shape="rect" coords="0,0,10,10"></map>`,
        expected: 'finding',
      },
    ],
  ],
]
