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
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      // The extension runs inside users' pages: only warnings and errors belong in their console.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
  },
  {
    // Scripts that run in the browser: the lab extension and the content script loader.
    files: ['lab/*.js', 'public/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
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
