import path from "path";
import { defineConfig } from "vite";
import Vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import VueMacros from 'unplugin-vue-macros/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Vuetify from 'vite-plugin-vuetify'


module.exports = defineConfig({
  base: '/ddf-tools/',
  resolve: {
    alias: {
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

    // https://github.com/antfu/unplugin-vue-components
    Components({
      // allow auto load components under `./src/components/`
      extensions: ['vue'],
      // allow auto import and register components
      include: [/\.vue$/, /\.vue\?vue/],
      dts: 'src/components.d.ts',
    }),

  ],

  ssr: {
    // TODO: workaround until they support native ESM
    noExternal: [
      'vuetify',
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
