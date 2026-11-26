// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContrastPreviewItem } from '@/types'
import { MANUAL_FINDING_SELECTION_HOST_ID } from '@/utils/manual-findings'

type MessageListener = (
  request: Record<string, unknown>,
  sender: unknown,
  sendResponse: (response: unknown) => void,
) => boolean
type Port = { name: string; onDisconnect: { addListener: (listener: () => void) => void } }

let onMessage: MessageListener
let onConnect: (port: Port) => void
const sentToExtension: unknown[] = []

const fakeChrome = {
  runtime: {
    onMessage: {
      addListener: (listener: MessageListener) => {
        onMessage = listener
      },
    },
    onConnect: {
      addListener: (listener: (port: Port) => void) => {
        onConnect = listener
      },
    },
    sendMessage: async (message: unknown) => {
      sentToExtension.push(message)
    },
  },
}

function installChrome() {
  vi.stubGlobal('chrome', fakeChrome)
  vi.stubGlobal('console', { ...console, log: () => undefined })
}

// The content script registers its listeners on import, so chrome has to exist first.
beforeAll(async () => {
  installChrome()
  await import('@/content')
})

beforeEach(() => {
  installChrome()
  sentToExtension.length = 0
  document.body.innerHTML = ''
})

function send(request: Record<string, unknown>) {
  let response: unknown
  onMessage(request, {}, (value) => {
    response = value
  })
  return response
}

describe('contrast preview', () => {
  const preview: ContrastPreviewItem = {
    id: 'item-1',
    selector: '#price',
    context: 'text',
    foregroundHex: '#1a1a1a',
    backgroundHex: '#ffffff',
  }

  function renderPrice() {
    document.body.innerHTML = '<p id="price" style="color: rgb(153, 153, 153) !important">R$ 10</p>'
    return document.getElementById('price') as HTMLElement
  }

  it('applies the proposed colours and restores the original inline style', () => {
    const price = renderPrice()

    expect(send({ action: 'SYNC_CONTRAST_PREVIEWS', previews: [preview] })).toEqual({
      status: 'OK',
      result: { applied: 1, missing: 0, unsupported: 0 },
    })
    expect(price.style.getPropertyValue('color')).toBe('rgb(26, 26, 26)')

    send({ action: 'CLEAR_CONTRAST_PREVIEWS' })

    expect(price.style.getPropertyValue('color')).toBe('rgb(153, 153, 153)')
    expect(price.style.getPropertyPriority('color')).toBe('important')
  })

  it('counts previews whose element is no longer on the page', () => {
    expect(
      send({ action: 'SYNC_CONTRAST_PREVIEWS', previews: [{ ...preview, selector: '#gone' }] }),
    ).toEqual({ status: 'OK', result: { applied: 0, missing: 1, unsupported: 0 } })
  })

  it('restores the page when the DevTools panel closes', () => {
    const price = renderPrice()
    let disconnect = () => undefined as void
    onConnect({
      name: 'contrast-preview-session',
      onDisconnect: { addListener: (listener) => (disconnect = listener) },
    })

    send({ action: 'SYNC_CONTRAST_PREVIEWS', previews: [preview] })
    disconnect()

    expect(price.style.getPropertyValue('color')).toBe('rgb(153, 153, 153)')
  })

  it('restores the page before it is left', () => {
    const price = renderPrice()

    send({ action: 'SYNC_CONTRAST_PREVIEWS', previews: [preview] })
    window.dispatchEvent(new Event('pagehide'))

    expect(price.style.getPropertyValue('color')).toBe('rgb(153, 153, 153)')
  })
})

describe('manual finding selection', () => {
  const overlay = () => document.getElementById(MANUAL_FINDING_SELECTION_HOST_ID)

  it('is cancelled with Escape, which also clears the stored draft', () => {
    expect(send({ action: 'START_MANUAL_FINDING_SELECTION' })).toEqual({ status: 'OK' })
    expect(overlay()).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(overlay()).toBeNull()
    expect(sentToExtension).toContainEqual({ action: 'CLEAR_MANUAL_FINDING_DRAFT' })
  })

  it('stores the clicked element as a draft', () => {
    document.body.innerHTML = '<button id="submit">Enviar</button>'
    send({ action: 'START_MANUAL_FINDING_SELECTION' })

    document.getElementById('submit')?.click()

    expect(overlay()).toBeNull()
    expect(sentToExtension).toContainEqual({
      action: 'STORE_MANUAL_FINDING_DRAFT',
      draft: expect.objectContaining({ selector: '#submit', tagName: 'button' }),
    })
  })

  it('resolves stored selectors again, skipping elements the extension injected', () => {
    document.body.innerHTML =
      '<button id="submit">Enviar</button><div id="nbr-highlight-1">destaque</div>'

    const response = send({
      action: 'RESOLVE_MANUAL_FINDING_SELECTORS',
      candidates: [
        { id: 'finding-1', selector: '#submit' },
        { id: 'finding-2', selector: '#nbr-highlight-1' },
        { id: 'finding-3', selector: '#missing' },
      ],
    }) as { resolved: Array<{ id: string }> }

    expect(response.resolved.map((item) => item.id)).toEqual(['finding-1'])
  })
})
