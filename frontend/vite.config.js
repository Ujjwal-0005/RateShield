import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/policies': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api-keys': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
