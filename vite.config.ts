import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/presupuesto/' // <- imprescindible para GitHub Pages en /bysilvaart/presupuesto
})
