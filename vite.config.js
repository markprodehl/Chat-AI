import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    css: {
      include: ['./src/App.css']
    },
    optimizeDeps: {
      include: ['react-syntax-highlighter']
    }
  }
})
