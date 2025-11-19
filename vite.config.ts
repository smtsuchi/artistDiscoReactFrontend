import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to backend if needed
      // Uncomment and configure if you need local backend proxy
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      // }
    }
  },
  build: {
    outDir: 'build', // Keep 'build' for Firebase compatibility
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
