import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { launchExtension, type ExtensionContext } from './extension-context'
import { openPopulatedPanel } from './populated-panel'

// 320 px is the width WCAG 1.4.10 asks content to reflow at, as in a DevTools panel docked aside.
const viewports = [
  { name: 'estreito', width: 320, height: 720 },
  { name: 'desktop', width: 1280, height: 800 },
]

const panelTabs = [/^Resumo$/, /^Violações \(\d+\)$/, /^Histórico \(\d+\)$/]

async function expectNoBlockingViolations(page: Page, label: string) {
  // Colors are only meaningful once fades have finished.
  await page.waitForFunction(() => document.getAnimations().length === 0)
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => `${node.target.join(' ')}: ${node.failureSummary}`),
    }))
  expect(blocking, label).toEqual([])
}

async function expectNoHorizontalScroll(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, label).toBeLessThanOrEqual(0)
}

let extension: ExtensionContext

test.beforeAll(async () => {
  extension = await launchExtension()
})

test.afterAll(async () => {
  await extension.close()
})

for (const viewport of viewports) {
  test(`painel com auditoria carregada é acessível na largura ${viewport.name}`, async () => {
    const page = await extension.context.newPage()
    // Without motion axe measures settled colors, not a panel halfway through opening.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openPopulatedPanel(page, extension.extensionId)

    for (const name of panelTabs) {
      const tab = page.getByRole('tab', { name })
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      const label = `${viewport.name} · ${name.source}`
      await expectNoBlockingViolations(page, label)
      await expectNoHorizontalScroll(page, label)
    }

    // An opened violation card shows the actions and evidence people work with.
    await page.getByRole('tab', { name: panelTabs[1] }).click()
    const ruleGroup = page.getByRole('button', { name: /Texto alternativo em imagens/ })
    if ((await ruleGroup.getAttribute('aria-expanded')) !== 'true') await ruleGroup.click()
    const card = page.locator('button.violation-item-header').first()
    if ((await card.getAttribute('aria-expanded')) !== 'true') await card.click()
    await expect(card).toHaveAttribute('aria-expanded', 'true')
    await expectNoBlockingViolations(page, `${viewport.name} · cartão aberto`)
    await expectNoHorizontalScroll(page, `${viewport.name} · cartão aberto`)

    await page.close()
  })
}

test('abas do painel são alcançadas e trocadas pelo teclado', async () => {
  const page = await extension.context.newPage()
  await openPopulatedPanel(page, extension.extensionId)
  await expect(page.getByRole('tab', { name: panelTabs[0] })).toBeVisible()

  let focusedRole: string | null = null
  for (let step = 0; step < 30 && focusedRole !== 'tab'; step += 1) {
    await page.keyboard.press('Tab')
    focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role') ?? null)
  }
  expect(focusedRole).toBe('tab')

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('tab', { name: panelTabs[1] })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await page.close()
})
