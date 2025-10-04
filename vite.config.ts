import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/presupuesto/', // <- imprescindible para GitHub Pages en /bysilvaart/presupuesto
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
  }
})
