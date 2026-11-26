import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  applyInlinePreviewStyle,
  captureInlineStyle,
  getContrastPreviewProperties,
  restoreInlineStyle,
} from '@/utils/contrast-preview'

class FakeStyle {
  private values = new Map<string, { value: string; priority: string }>()

  getPropertyValue(property: string) {
    return this.values.get(property)?.value ?? ''
  }

  getPropertyPriority(property: string) {
    return this.values.get(property)?.priority ?? ''
  }

  setProperty(property: string, value: string, priority = '') {
    this.values.set(property, { value, priority })
  }

  removeProperty(property: string) {
    const previous = this.getPropertyValue(property)
    this.values.delete(property)
    return previous
  }
}

const asStyle = (style: FakeStyle) => style as unknown as CSSStyleDeclaration

describe('getContrastPreviewProperties', () => {
  it('maps each contrast context to the CSS properties it previews', () => {
    assert.deepEqual(getContrastPreviewProperties('text'), {
      foreground: 'color',
      background: 'background-color',
    })
    assert.deepEqual(getContrastPreviewProperties('component'), {
      foreground: 'border-color',
      background: 'background-color',
    })
    assert.deepEqual(getContrastPreviewProperties('focus'), {
      foreground: 'outline-color',
      background: 'background-color',
    })
    assert.deepEqual(getContrastPreviewProperties('graphic', 'stroke'), {
      foreground: 'stroke',
      background: 'background-color',
    })
    assert.equal(getContrastPreviewProperties('graphic'), null)
  })
})

describe('inline preview styles', () => {
  it('restores an inline value and its priority after a preview', () => {
    const style = new FakeStyle()
    style.setProperty('color', '#123456', 'important')

    const original = captureInlineStyle(asStyle(style), 'color')
    applyInlinePreviewStyle(asStyle(style), 'color', '#abcdef')
    assert.equal(style.getPropertyValue('color'), '#abcdef')
    assert.equal(style.getPropertyPriority('color'), 'important')

    restoreInlineStyle(asStyle(style), 'color', original)
    assert.equal(style.getPropertyValue('color'), '#123456')
    assert.equal(style.getPropertyPriority('color'), 'important')
  })

  it('removes the preview when the element had no inline value', () => {
    const style = new FakeStyle()

    const original = captureInlineStyle(asStyle(style), 'background-color')
    applyInlinePreviewStyle(asStyle(style), 'background-color', '#ffffff')
    restoreInlineStyle(asStyle(style), 'background-color', original)

    assert.equal(style.getPropertyValue('background-color'), '')
  })
})
