import path from "path";
import { defineConfig } from "vite";
import Vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import VueMacros from 'unplugin-vue-macros/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Vuetify from 'vite-plugin-vuetify'


module.exports = defineConfig({
  resolve: {
    alias: {
      'vite-vanilla-ts-lib-starter-core': path.resolve(__dirname, '../core/index.ts'),
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
});
