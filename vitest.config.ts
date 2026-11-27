import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      restoreMocks: true,
      unstubGlobals: true,
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
            exclude: ['src/rules/**'],
            setupFiles: ['tests/setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'components',
            include: ['src/**/*.test.tsx'],
            environment: 'jsdom',
            setupFiles: ['tests/setup.ts', 'tests/setup-dom.ts'],
          },
        },
        {
          extends: true,
          test: {
            // Rules read layout, computed styles and focus, which only a real browser provides.
            name: 'rules',
            include: ['src/rules/**/*.test.ts'],
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  }),
)
