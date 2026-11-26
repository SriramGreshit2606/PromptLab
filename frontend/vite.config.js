import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// In development, requests to /api are proxied to the FastAPI backend.
// This avoids CORS entirely (the backend has no CORS middleware yet).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
      },
    },
  }
})
