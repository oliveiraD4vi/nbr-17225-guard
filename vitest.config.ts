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
      ],
    },
  }),
)
