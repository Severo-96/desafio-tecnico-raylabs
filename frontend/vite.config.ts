import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket support para HMR
        configure: (proxy, _options) => {
          const target = process.env.VITE_API_URL || 'http://localhost:3000';
          console.log(`[Vite Proxy] Proxying /api to ${target}`);
          
          proxy.on('error', (err, _req, _res) => {
            console.log('Error in proxy:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Request:', req.method, req.url);
          });
        },
      },
    },
  },
})
