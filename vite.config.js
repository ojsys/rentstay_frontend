import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Production builds are served by Django: the bundles are collected as
  // static files under /static/app/ (see backend/core/spa.py). The dev server
  // keeps serving from /.
  base: command === 'build' ? '/static/app/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', 'lucide-react', 'react-icons'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
}))
