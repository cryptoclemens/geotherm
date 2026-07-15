import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      // Nur die Rechenkerne. src/core/ ist bewusst draußen: shadcn generiert
      // via components.json ("ui": "@/core/ui") nach src/core/ui/, jede neue
      // Komponente würde die Schwelle senken.
      include: ['src/apps/*/calc/**'],
      thresholds: { lines: 80, functions: 80, branches: 80 },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
