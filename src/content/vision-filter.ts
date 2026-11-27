import type { VisionSimulationFilter } from '@/types'

const VISION_FILTER_HOST_ID = 'nbr-vision-filter-host'
const VISION_FILTER_IDS = {
  protanopia: 'nbr-protanopia-filter',
  deuteranopia: 'nbr-deuteranopia-filter',
  tritanopia: 'nbr-tritanopia-filter',
} as const

export function applyVisionFilter(filter: VisionSimulationFilter) {
  try {
    if (!document.body) return

    ensureVisionFilterDefs()

    const target = document.documentElement
    if (!filter || filter.type === 'none') {
      target.style.filter = 'none'
      return
    }

    switch (filter.type) {
      case 'protanopia':
      case 'deuteranopia':
      case 'tritanopia':
        target.style.filter = `url(#${VISION_FILTER_IDS[filter.type]})`
        break
      case 'blur':
        target.style.filter = `blur(${(filter.intensity / 100) * 10}px)`
        break
    }
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao aplicar simulador de percepção visual:', error)
  }
}

function ensureVisionFilterDefs() {
  if (document.getElementById(VISION_FILTER_HOST_ID)) return

  const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  host.setAttribute('id', VISION_FILTER_HOST_ID)
  host.setAttribute('aria-hidden', 'true')
  host.style.position = 'absolute'
  host.style.width = '0'
  host.style.height = '0'
  host.style.pointerEvents = 'none'

  host.innerHTML = `
    <defs>
      <filter id="${VISION_FILTER_IDS.protanopia}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0" />
      </filter>
      <filter id="${VISION_FILTER_IDS.deuteranopia}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0" />
      </filter>
      <filter id="${VISION_FILTER_IDS.tritanopia}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0" />
      </filter>
    </defs>
  `

  document.body.appendChild(host)
}
