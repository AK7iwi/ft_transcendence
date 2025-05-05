import { defineConfig } from 'vite';

export default defineConfig({
  root: 'front_srcs',
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://back:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': './front_srcs',
    },
  },
}); 