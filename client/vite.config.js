import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // 🚀 Force Vite to pre-bundle heavy libraries immediately
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      'jspdf',
      'lucide-react',
      'socket.io-client',
      'axios',
      'zustand'
    ]
  },
  build: {
    // 📦 Split vendor code (libraries) from your actual app code for faster caching in Production
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group heavy libraries into their own chunks
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('lucide-react')) return 'vendor-icons';

            // Put all other node_modules in a generic vendor chunk
            return 'vendor';
          }
        }
      }
    }
  }
})