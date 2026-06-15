import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Forward cookies between browser and backend during development
        cookieDomainRewrite: 'localhost',
      },
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
      '/share': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
