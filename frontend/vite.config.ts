import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@/': `${resolve(__dirname, 'src')}/`,
      '@/components': `${resolve(__dirname, 'src/components')}`,
      '@/hooks': `${resolve(__dirname, 'src/hooks')}`,
      '@/lib': `${resolve(__dirname, 'src/lib')}`,
      '@/providers': `${resolve(__dirname, 'src/providers')}`,
    },
  },
}) 