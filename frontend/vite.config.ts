import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_', // ⚠️ 确保VITE_前缀变量能暴露到前端
  server: {
    proxy: {
      '/graphql': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  publicDir: 'public',
});
