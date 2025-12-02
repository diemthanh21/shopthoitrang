import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 300,   // adjust if you want less polling
    },
    hmr: {
      overlay: true,   // keep overlay if you like
    },
  },
});
