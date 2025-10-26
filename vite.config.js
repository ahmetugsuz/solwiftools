import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: './frontend',
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['axios'],
      output: {
        globals: {
          axios: 'axios'
        }
      }
    }
  },
  base: '/',
  resolve: {
    alias: {
      'axios': 'axios/dist/axios.min.js'
    }
  },
  optimizeDeps: {
    include: ['axios']
  }
}) 