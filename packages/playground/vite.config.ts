import path from "path";
import { defineConfig } from "vite";
import Vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import VueMacros from 'unplugin-vue-macros/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Vuetify from 'vite-plugin-vuetify'

module.exports = defineConfig({
  base: '/ddf-tools/',
  resolve: {
    alias: {
      '@deconz-community/ddf-bundler': path.resolve(__dirname, '../bundler/index.ts'),
      '@deconz-community/ddf-validator': path.resolve(__dirname, '../validator/index.ts'),
      'node-fetch': 'axios',
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    VueMacros({
      plugins: {
        vue: Vue({
          reactivityTransform: false,
        }),
      },
    }),

    Vuetify({}),

    Pages({
      extensions: ['vue'],
    }),

    Layouts(),
    
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue/macros',
      ],
      dts: 'src/auto-imports.d.ts',
      vueTemplate: true,
    }),
  ],

  ssr: {
    // TODO: workaround until they support native ESM
    noExternal: [
      'vuetify'
    ],
  },

  server: {
    fs: {
      allow: [
        '..',
        '../../node_modules'
      ],
    },
  },
});
