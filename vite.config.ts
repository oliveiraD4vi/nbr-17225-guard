import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-manifest',
      closeBundle() {
        const source = path.resolve(__dirname, 'public/manifest.json')
        const target = path.resolve(__dirname, 'dist/manifest.json')
        fs.copyFileSync(source, target)
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup.html'),
        report: path.resolve(__dirname, 'src/report.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
