import { chromium, type BrowserContext } from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export interface ExtensionContext {
  context: BrowserContext
  extensionId: string
  close: () => Promise<void>
}

/** Starts Chromium with the built extension from dist/ in a throwaway profile. */
export async function launchExtension(): Promise<ExtensionContext> {
  const userDataDir = await mkdtemp(join(tmpdir(), 'guardiao-e2e-'))
  const extensionPath = resolve(process.cwd(), 'dist')
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })

  let [serviceWorker] = context.serviceWorkers()
  serviceWorker ??= await context.waitForEvent('serviceworker', { timeout: 20_000 })

  return {
    context,
    extensionId: new URL(serviceWorker.url()).host,
    close: async () => {
      await context.close()
      await rm(userDataDir, { recursive: true, force: true })
    },
  }
}
