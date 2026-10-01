import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      // Data Extraction backend (port 8101)
      '/api/extraction': {
        target: 'http://localhost:8101',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/extraction/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept', 'text/event-stream');
          });
        },
      },
      // Toxicity Prediction backend (port 8102) - extended timeout for heavy model inference
      '/api/tox': {
        target: 'http://localhost:8102',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tox/, '/api'),
        timeout: 600000,       // 10 minutes
        proxyTimeout: 600000,  // 10 minutes
      },
      // Knowledge Graph backend (port 8103)
      '/api/kg': {
        target: 'http://localhost:8103',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kg/, '/api'),
      },
    },
  },
})
