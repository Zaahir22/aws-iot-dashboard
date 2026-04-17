import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // Ensure compatibility for older libraries that expect global Buffer/process
      'buffer': 'vite-plugin-node-polyfills/shims/buffer',
      'process': 'vite-plugin-node-polyfills/shims/process',
    }
  }
})
