import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // port busy ho to agla free port utha le
    // Browser khulne ka kaam start-website.bat karta hai (server ready hone ke baad)
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Firebase ka code alag chunk me — app fast load hoti hai
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor'
          return undefined
        },
      },
    },
  },
})
