import path from 'node:path'
import { defineConfig } from 'vite'
import packageJson from './package.json'

function getPackageName() {
  return packageJson.name.replace(/@[^\/]+\//g, '')
}

function getPackageNameCamelCase() {
  try {
    return getPackageName().replace(/[-]./g, char => char[1].toUpperCase())
  }
  catch (err) {
    throw new Error('Name property in package.json is missing.')
  }
}

const fileName = {
  es: `${getPackageName()}.mjs`,
  cjs: `${getPackageName()}.cjs`,
} as const

const formats = Object.keys(fileName) as Array<keyof typeof fileName>

// eslint-disable-next-line antfu/no-cjs-exports
module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'index.ts'),
      name: getPackageNameCamelCase(),
      formats,
      fileName: format => fileName[format as keyof typeof fileName],
    },
    rollupOptions: {
      // deps that shouldn't be bundled
      external: [
        '@noble/secp256k1',
        'pako',
      ],
    },
  },
})
