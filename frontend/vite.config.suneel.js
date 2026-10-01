import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const customCss = `
          <style>
            :root {
              --sidebar-bg: linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%) !important;
              --sidebar-hover: rgba(255, 255, 255, 0.1) !important;
              --sidebar-active: rgba(255, 255, 255, 0.15) !important;
            }
            .sidebar-logo img {
              filter: brightness(0) invert(1) !important;
            }
            .step-pillar {
              font-size: 0.75rem !important;
              color: #012b72 !important;
              background: #eef2ff !important;
              font-family: var(--font-sans) !important;
              padding: 5px 12px !important;
              border-radius: var(--radius-full) !important;
              font-weight: 700 !important;
              border: 1px solid #004de6 !important;
              display: inline-block !important;
              white-space: nowrap !important;
              letter-spacing: 0.02em !important;
            }
            /* Sidebar Collapse & Nav Text Styles */
            .sidebar { position: relative !important; }
            .sidebar.collapsed { width: 80px !important; }
            .sidebar.collapsed .sidebar-item { justify-content: center !important; padding-left: 0 !important; padding-right: 0 !important; }
            .sidebar.collapsed .sidebar-item-icon { margin-right: 0 !important; margin-left: 0 !important; }
            .sidebar-toggle-btn {
              position: absolute; right: -14px; top: 50%; transform: translateY(-50%);
              width: 28px; height: 28px; border-radius: 50%;
              background: #ffffff; color: #1e3a8a; border: 1px solid #cbd5e1;
              display: flex; align-items: center; justify-content: center;
              cursor: pointer; z-index: 100; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
              transition: all 0.2s ease;
            }
            .sidebar-toggle-btn:hover { background: #f8fafc; color: #3b82f6; transform: translateY(-50%) scale(1.05); }
            .sidebar-item span:not(.sidebar-item-icon) {
              font-size: 1.05rem !important;
              font-weight: 600 !important;
            }
          </style>
        `;
        return html
          .replace(/href="\/vite\.svg"/, 'href="/hcltech-logo.svg"')
          .replace('Drug Interaction &amp; Analysis Platform', 'ISP - Translational Research Platform | HCLTech')
          .replace('Drug Interaction & Analysis Platform', 'ISP - Translational Research Platform | HCLTech')
          .replace(/Unified Drug Interaction.*?analysis\./, 'ISP - Translational Research Platform by HCLTech.')
          .replace('</head>', customCss + '</head>');
      }
    }
  ],
  cacheDir: '.vite_cache_suneel',
  resolve: {
    alias: {
      './modules/data-extraction/DataExtractionApp': resolve(__dirname, 'src/modules/data-extraction/DataExtractionApp.branded.jsx'),
      './modules/toxicity/ToxicityApp': resolve(__dirname, 'src/modules/toxicity/ToxicityApp.gauravvm.jsx'),
      './modules/knowledge-graph/KnowledgeGraphApp': resolve(__dirname, 'src/modules/knowledge-graph/KnowledgeGraphApp.branded.jsx'),
      './components/Sidebar': resolve(__dirname, 'src/components/Sidebar.branded.jsx'),
      './components/TopBar': resolve(__dirname, 'src/components/TopBar.branded.jsx'),
      './pages/HomePage': resolve(__dirname, 'src/pages/HomePage.branded.jsx'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5190,
    proxy: {
      // Data Extraction backend (port 8201)
      '/api/extraction': {
        target: 'http://localhost:8201',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/extraction/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept', 'text/event-stream');
          });
        },
      },
      // Toxicity Prediction backend (port 8202)
      '/api/tox': {
        target: 'http://localhost:8202',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tox/, '/api'),
      },
      // Knowledge Graph backend (port 8203)
      '/api/kg': {
        target: 'http://localhost:8203',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kg/, '/api'),
      },
    },
  },
})
