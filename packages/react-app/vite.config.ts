import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@flexwise/shared': resolve(__dirname, '../shared/lib/index.ts')
    }
  },
  server: {
    port: 3001
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})