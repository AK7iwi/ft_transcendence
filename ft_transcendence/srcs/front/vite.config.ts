import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    hmr: {
      host: 'localhost',
      port: 5173
    },
    watch: {
      usePolling: true
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