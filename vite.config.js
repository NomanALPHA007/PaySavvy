import { defineConfig } from 'vite'

export default defineConfig({
  // Server configuration
  server: {
    host: '0.0.0.0',
    port: 5000,
    open: false
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  
  // Environment variables
  define: {
    'process.env': process.env
  },
  
  // Base URL for deployment
  base: './',
  
  // Plugins (add any needed plugins here)
  plugins: [],
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: []
  }
})
