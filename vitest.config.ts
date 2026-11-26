import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
      setupFiles: ['tests/setup.ts'],
      restoreMocks: true,
      unstubGlobals: true,
    },
  }),
)
