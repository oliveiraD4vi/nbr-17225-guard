import assert from 'node:assert/strict'
import { beforeEach, describe, it, vi } from 'vitest'
import {
  getElementIdAttribute,
  getElementSelector,
  isGuardInjectedElement,
} from '@/utils/element-identity'

class FakeHTMLElement {
  parentElement = null
  private idAttribute: string
  id: unknown

  constructor(idAttribute = '', id: unknown = '') {
    this.idAttribute = idAttribute
    this.id = id
  }

  getAttribute(name: string) {
    return name === 'id' && this.idAttribute ? this.idAttribute : null
  }

  closest() {
    return null
  }
}

const asElement = (element: FakeHTMLElement) => element as unknown as HTMLElement

describe('DOM identifiers', () => {
  beforeEach(() => {
    vi.stubGlobal('HTMLElement', FakeHTMLElement)
    vi.stubGlobal('SVGElement', class FakeSVGElement extends FakeHTMLElement {})
    vi.stubGlobal('CSS', { escape: (value: string) => value })
  })

  it('reads the id attribute even when a form control clobbers element.id', () => {
    const clobberedForm = new FakeHTMLElement('audit-form', { tagName: 'INPUT' })

    assert.equal(typeof clobberedForm.id, 'object')
    assert.equal(getElementIdAttribute(asElement(clobberedForm)), 'audit-form')
    assert.equal(getElementSelector(asElement(clobberedForm)), '#audit-form')
    assert.equal(isGuardInjectedElement(asElement(clobberedForm)), false)
  })

  it('recognises elements injected by the extension', () => {
    const guardElement = new FakeHTMLElement('nbr-highlight-example', { tagName: 'INPUT' })
    assert.equal(isGuardInjectedElement(asElement(guardElement)), true)
  })

  it('returns an empty id for elements without one', () => {
    const element = new FakeHTMLElement('', { tagName: 'INPUT' })
    assert.equal(getElementIdAttribute(asElement(element)), '')
  })
})
