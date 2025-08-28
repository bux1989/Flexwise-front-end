import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@flexwise/shared': resolve(__dirname, '../shared/lib/index.ts')
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})