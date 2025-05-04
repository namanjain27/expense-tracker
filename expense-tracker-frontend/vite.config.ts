import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    proxy: {
      '/expenses': 'http://localhost:8000',
      '/recurring-expenses': 'http://localhost:8000'
      //change to BE running port https://expense-tracker-backend-4gej.onrender.com
    },
  },
  plugins: [react()],
}) 