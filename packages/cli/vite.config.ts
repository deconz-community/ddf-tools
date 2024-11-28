import path, { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { VitePluginNode } from 'vite-plugin-node'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // TODO: Do I need this ?
    VitePluginNode({
      adapter: 'express',
      appPath: resolve(__dirname, 'src/index.ts'),
    }),
  ],

  build: {
    rollupOptions: {
      external: [
        '@commander-js/extra-typings',
        '@deconz-community/ddf-bundler',
        '@deconz-community/ddf-validator',
        'base64-js',
        'chalk',
        'commander',
        'fast-glob',
        'ora',
        'zod',
        'zod-validation-error',
      ],
    },
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
  },
  resolve: {
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    alias: {
      '@deconz-community/ddf-bundler': path.resolve(__dirname, '../bundler/index.ts'),
      '@deconz-community/ddf-validator': path.resolve(__dirname, '../validator/index.ts'),
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
})
