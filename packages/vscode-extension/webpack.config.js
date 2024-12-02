/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// @ts-check
'use strict'

// @ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig */

const path = require('node:path')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

/** @type WebpackConfig */
const commonConfig = {
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  resolve: {
    alias: {
      '@deconz-community/ddf-bundler': path.resolve(__dirname, '../bundler/index.ts'),
      '@deconz-community/ddf-validator': path.resolve(__dirname, '../validator/index.ts'),
      '@deconz-community/rest-client': path.resolve(__dirname, '../rest-client/index.ts'),
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },

    mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.ts', '.js'], // support ts-files and js-files
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
      assert: require.resolve('assert'),
    },
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, // disable chunks by default since web extensions must be a single bundle
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser', // provide a shim for the global `process` variable
    }),
  ],
  externals: {
    vscode: 'commonjs vscode', // ignored because it doesn't exist
  },
  performance: {
    hints: false,
  },
  devtool: 'source-map', // create a source map that points to the original source file
  infrastructureLogging: {
    level: 'log', // enables logging required for problem matchers
  },
}

/** @type WebpackConfig */
const webExtensionConfig = {
  ...commonConfig,
  target: 'webworker', // extensions run in a webworker context
  entry: {
    extension: './src/web/extension.ts',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './dist/web'),
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '../../[resource-path]',
  },

  module: {
    rules: [
      {
        test: /\.d\.ts$/,
        exclude: /node_modules/,
        loader: 'null-loader',
      },
      {
        test: /\.ts$/,
        exclude: [
          /node_modules/,
          /views/,
          /\.d\.ts$/,
        ],
        loader: 'ts-loader',
      },
    ],
  },
}

/** @type WebpackConfig */
const webViewConfig = {
  ...commonConfig,
  entry: [
    './src/web/views/DDBEditor.ts',
  ],
  output: {
    filename: 'DDBEditor.js',
    path: path.join(__dirname, './dist/views'),
  },

  module: {
    rules: [
      {
        test: /\.d\.ts$/,
        loader: 'null-loader',
      },
      {
        test: /\.ts$/,
        exclude: [
          /\.d\.ts$/,
        ],
        loader: 'ts-loader',
      },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/**/*.html', to: '[name][ext]' },
      ],
    }),
  ],
}

module.exports = [
  webExtensionConfig,
  webViewConfig,
]
