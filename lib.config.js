// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/json2pbf.ts'),
      formats: ['es', 'cjs'],
      fileName: 'lib',
    },
  }
})