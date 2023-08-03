// rollup.config.js
import _esbuild from 'rollup-plugin-esbuild'

let esbuild = _esbuild // This in case esbuild is a function
if (_esbuild.default) { // This if it is an object
  esbuild = _esbuild.default
}

export default {
  input: 'src/hooks.ts',
  output: {
    format: 'es',
    file: 'pb_hooks/index.pb.js',
  },

  plugins: [
    esbuild({
      // All options are optional
      include: /\.[jt]sx?$/, // default, inferred from `loaders` option
      exclude: /node_modules/, // default
      sourceMap: true, // default
      minify: false,
      target: 'esnext',
      tsconfig: 'tsconfig.json', // default
    }),
  ],
}
