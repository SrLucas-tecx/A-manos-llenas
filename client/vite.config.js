import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Las peticiones a /api se reenvían al servidor Express (PORT del .env = 3000)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
