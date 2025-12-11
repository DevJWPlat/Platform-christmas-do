import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // This is IMPORTANT for GitHub Pages - must match repo name exactly (case-sensitive)
  base: '/Platform-christmas-do/'
  //base: '/', 

  build: {
    outDir: 'docs',
  },
  plugins: [
    vue(),
    // Only include vueDevTools in development
    ...(process.env.NODE_ENV !== 'production' ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
