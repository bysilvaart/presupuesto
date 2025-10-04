import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)

let testEnvironment: 'jsdom' | 'node' = 'jsdom'

try {
  require.resolve('jsdom')
} catch {
  testEnvironment = 'node'
}

export default defineConfig({
  plugins: [react()],
  base: '/presupuesto/', // <- imprescindible para GitHub Pages en /bysilvaart/presupuesto
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        sw: resolve(rootDir, 'src/pwa/service-worker.js')
      },
      output: {
        entryFileNames: (chunkInfo) => (chunkInfo.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js')
      }
    }
  },
  test: {
    environment: testEnvironment,
    setupFiles: ['./vitest.setup.ts']
  }
})
