/**
 * Calcula a razão de contraste WCAG entre duas cores
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16)
    const r = (rgb >> 16) & 255
    const g = (rgb >> 8) & 255
    const b = rgb & 255

    const [rs, gs, bs] = [r, g, b].map((x) => {
      x = x / 255
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Obtém a cor de fundo efetiva de um elemento
 */
export function getEffectiveBackgroundColor(element: HTMLElement): string {
  const parseRgbColor = (color: string) => {
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (!match) return null

    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
      a: match[4] === undefined ? 1 : Number(match[4]),
    }
  }

  const blend = (
    foreground: { r: number; g: number; b: number; a: number },
    background: { r: number; g: number; b: number; a: number },
  ) => {
    const alpha = foreground.a + background.a * (1 - foreground.a)
    if (alpha === 0) return { r: 255, g: 255, b: 255, a: 1 }

    return {
      r: Math.round(
        (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
      ),
      g: Math.round(
        (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
      ),
      b: Math.round(
        (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
      ),
      a: alpha,
    }
  }

  let el: HTMLElement | null = element
  let effectiveColor = { r: 255, g: 255, b: 255, a: 1 }

  while (el) {
    const bgColor = window.getComputedStyle(el).backgroundColor
    const parsedColor = parseRgbColor(bgColor)
    if (parsedColor && parsedColor.a > 0) {
      effectiveColor = blend(parsedColor, effectiveColor)
      if (effectiveColor.a >= 1) break
    }
    el = el.parentElement
  }

  return `rgb(${effectiveColor.r}, ${effectiveColor.g}, ${effectiveColor.b})`
}

/**
 * Converte RGB para HEX
 */
export function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return '#ffffff'

  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])

  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? `0${hex}` : hex
      })
      .join('')
  )
}
