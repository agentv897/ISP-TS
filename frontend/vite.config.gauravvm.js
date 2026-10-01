import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite_cache',
  resolve: {
    alias: {
      './modules/knowledge-graph/KnowledgeGraphApp': path.resolve(__dirname, 'src/modules/knowledge-graph/KnowledgeGraphApp.gauravvm.jsx'),
      './modules/data-extraction/DataExtractionApp': path.resolve(__dirname, 'src/modules/data-extraction/DataExtractionApp.gauravvm.jsx')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 7070,
    proxy: {
      // Data Extraction backend (port 7771)
      '/api/extraction': {
        target: 'http://localhost:7771',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/extraction/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept', 'text/event-stream');
          });
        },
      },
      // Toxicity Prediction backend (port 7772)
      '/api/tox': {
        target: 'http://localhost:7772',
        changeOrigin: true,
        timeout: 360000,
        proxyTimeout: 360000,
        rewrite: (path) => path.replace(/^\/api\/tox/, '/api'),
      },
      // Knowledge Graph backend (port 7773)
      '/api/kg': {
        target: 'http://localhost:7773',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kg/, '/api'),
      },
    },
  },
})
