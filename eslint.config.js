import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // The DevTools panel has no chrome.storage; its screens go through src/utils/extension-storage.
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/devtools-panel.tsx',
      'src/popup.tsx',
      'src/report.tsx',
    ],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'chrome',
          property: 'storage',
          message: 'Use extensionStorageGet/extensionStorageSet from @/utils/extension-storage.',
        },
      ],
    },
  },
  eslintConfigPrettier,
])
