import { defineConfig } from 'vite'

export default defineConfig({
  // Root directory and public assets
  root: '.',
  publicDir: 'public',
  
  // Server configuration
  server: {
    host: '0.0.0.0',
    port: 5000,
    open: false,
    allowedHosts: ['all']
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: './public/index.html'
      },
      output: {
        manualChunks: undefined,
      }
    }
  },
  
  // Environment variables (only expose VITE_ prefixed vars for security)
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  
  // Base URL for deployment
  base: './',
  
  // Module resolution
  resolve: {
    alias: {
      '@': '/src',
      '@data': '/src/data',
      '@utils': '/src/utils',
      '@styles': '/src/styles'
    }
  },
  
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
