// rollup.config.js
import esbuild from 'rollup-plugin-esbuild'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import multi from '@rollup/plugin-multi-entry'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: {
    include: ['src/**/*.ts'],
    exclude: ['**/store.ts'],
  },
  output: {
    format: 'es',
    file: 'pb_hooks/index.pb.js',
  },

  plugins: [
    nodeResolve(),
    commonjs(),
    nodePolyfills(),
    esbuild({
      // All options are optional
      include: /\.[jt]sx?$/, // default, inferred from `loaders` option
      exclude: /node_modules/, // default
      sourceMap: true, // default
      minify: false,
      target: 'esnext',
      tsconfig: 'tsconfig.json', // default
    }),
    multi(),
  ],

}
