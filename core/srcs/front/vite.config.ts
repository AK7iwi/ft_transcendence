import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    // Désactivation du HTTPS en développement
    https: false,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws'
    },
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/front_srcs'
    }
  }
});
