import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { launchExtension } from './extension-context'

test('popup e superfícies estáticas não apresentam violações críticas ou sérias', async () => {
  const { context, extensionId, close } = await launchExtension()

  try {
    const page = await context.newPage()

    for (const path of ['src/popup.html', 'src/devtools-panel.html', 'src/report.html']) {
      await page.goto(`chrome-extension://${extensionId}/${path}`)
      await expect(page.locator('#root')).not.toBeEmpty()

      const results = await new AxeBuilder({ page }).analyze()
      const blockingViolations = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      )

      expect(blockingViolations, path).toEqual([])
    }

    await page.goto(`chrome-extension://${extensionId}/src/popup.html`)
    const keyboardFocusOrder: string[] = []
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press('Tab')
      keyboardFocusOrder.push(
        await page.evaluate(() => {
          const active = document.activeElement
          if (!(active instanceof HTMLElement)) return ''
          return `${active.tagName}:${active.getAttribute('href') || active.getAttribute('aria-label') || active.innerText}`
        }),
      )
    }

    expect(new Set(keyboardFocusOrder.filter(Boolean)).size).toBeGreaterThanOrEqual(4)
    expect(keyboardFocusOrder.slice(0, 4).every((item) => !item.startsWith('BODY:'))).toBe(true)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const transitionDuration = await page.evaluate(
      () => getComputedStyle(document.querySelector('button') as Element).transitionDuration,
    )
    expect(transitionDuration.split(',').every((value) => parseFloat(value) <= 0.00001)).toBe(true)

    await page.emulateMedia({ reducedMotion: null, forcedColors: 'active' })
    await page.keyboard.press('Tab')
    const focusOutline = await page.evaluate(
      () => getComputedStyle(document.activeElement as Element).outlineStyle,
    )
    expect(focusOutline).not.toBe('none')
  } finally {
    await close()
  }
})
