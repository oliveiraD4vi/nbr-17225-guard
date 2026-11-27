import type { PageAuditContext } from '@/types'
import { getAccessibleName } from '@/utils/accessible-name'
import { getVisibleText, isElementVisible } from '@/utils/visibility'

function normalizeContextText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR')
}

export function capturePageAuditContext(): PageAuditContext {
  const visibleNavigationBlocks = Array.from(
    document.querySelectorAll<HTMLElement>('nav, [role="navigation"]'),
  ).filter(isElementVisible)
  const navigationSignatures = visibleNavigationBlocks
    .map((navigation) =>
      Array.from(navigation.querySelectorAll<HTMLElement>('a[href]'))
        .filter(isElementVisible)
        .map((link) => normalizeContextText(getAccessibleName(link)))
        .filter(Boolean)
        .join('|'),
    )
    .filter(Boolean)
  const helpSignatures = Array.from(
    document.querySelectorAll<HTMLElement>('a[href], button, [role="button"]'),
  )
    .filter(isElementVisible)
    .map((element) => normalizeContextText(getAccessibleName(element)))
    .filter((name) => /\b(ajuda|suporte|faq|atendimento)\b/.test(name))
    .sort()
  const locationMechanisms: string[] = []

  if (navigationSignatures.length > 0) locationMechanisms.push('navegação')
  if (
    Array.from(
      document.querySelectorAll<HTMLElement>(
        'input[type="search"], [role="search"], form[role="search"]',
      ),
    ).some(isElementVisible)
  ) {
    locationMechanisms.push('busca')
  }
  if (
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '[aria-label*="breadcrumb" i], [aria-label*="trilha" i], [class*="breadcrumb" i]',
      ),
    ).some(isElementVisible)
  ) {
    locationMechanisms.push('trilha de navegação')
  }
  if (
    Array.from(document.querySelectorAll<HTMLElement>('a[href]')).some((element) =>
      /\b(mapa do site|sitemap|índice|sumário)\b/.test(
        normalizeContextText(getAccessibleName(element)),
      ),
    )
  ) {
    locationMechanisms.push('mapa ou índice')
  }

  const controlActions = Array.from(
    document.querySelectorAll<HTMLElement>(
      'button, [role="button"], a[href], input[type="button"], input[type="submit"]',
    ),
  )
    .filter(isElementVisible)
    .flatMap((element) => {
      const name = normalizeContextText(getAccessibleName(element))
      const rawAction =
        element.getAttribute('href') ||
        element.getAttribute('data-action') ||
        element.getAttribute('name') ||
        element.getAttribute('type') ||
        ''
      if (!name || !rawAction) return []

      // Actions that are not URLs (a button type or name) are kept as declared.
      const action = URL.parse(rawAction, window.location.href)?.pathname ?? rawAction
      return [{ action: normalizeContextText(action), name }]
    })
  const criticalActions = controlActions
    .map((item) => item.name)
    .filter((name) =>
      /\b(pagar|confirmar compra|finalizar|excluir|cancelar conta|remover definitivamente)\b/.test(
        name,
      ),
    )
  const formFieldKeys = Array.from(
    document.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select, textarea'),
  )
    .filter(isElementVisible)
    .map((field) => {
      const autocomplete = normalizeContextText(field.getAttribute('autocomplete') || '')
      const name = normalizeContextText(getAccessibleName(field))
      return autocomplete || name ? `${autocomplete}:${name}` : ''
    })
    .filter(Boolean)
  const bodyText = normalizeContextText(getVisibleText(document.body).slice(0, 10_000))

  return {
    navigationSignatures,
    helpSignatures,
    locationMechanisms: [...new Set(locationMechanisms)],
    controlActions,
    criticalActions: [...new Set(criticalActions)],
    formFieldKeys: [...new Set(formFieldKeys)],
    hasReviewCue: /\b(revisar|revisão|confirmar|confirmação|voltar|cancelar)\b/.test(bodyText),
  }
}
