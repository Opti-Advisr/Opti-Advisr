import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.API_BASE_URL || '').replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      proxy: apiTarget
        ? {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyRequest) => {
                  if (env.API_KEY) {
                    proxyRequest.setHeader('x-api-key', env.API_KEY);
                  }
                });
              },
            },
          }
        : {},
    },
  };
});
