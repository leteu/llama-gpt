import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      app: resolve(__dirname, '.'),
      types: resolve(__dirname, './types'),
      src: resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: {},
  },
  build: {
    outDir: './dist',
  },
})
