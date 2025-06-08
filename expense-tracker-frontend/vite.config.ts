import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    proxy: {
      'https://expense-tracker-frontend-32m0.onrender.com/api': {
        target: 'https://expense-tracker-backend-ayln.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
  },
  plugins: [react()],
}) 
