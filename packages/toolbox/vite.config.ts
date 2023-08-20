import path from "path";
import { defineConfig } from "vite";
import Vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import VueMacros from 'unplugin-vue-macros/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'


module.exports = defineConfig({
  base: '/ddf-tools/',
  resolve: {
    alias: {
      '@deconz-community/ddf-bundler': path.resolve(__dirname, '../bundler/index.ts'),
      '@deconz-community/ddf-validator': path.resolve(__dirname, '../validator/index.ts'),
      '@deconz-community/rest-client': path.resolve(__dirname, '../rest-client/index.ts'),
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
        '@vueuse/head',
        '@vueuse/core',
        {
          // https://github.com/sindresorhus/ts-extras
          'ts-extras': [
            'objectKeys',
          ],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: [
        'src/composables',
        'src/stores',
      ],
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

    
    // https://github.com/antfu/vite-plugin-pwa
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'Deconz-Ruler',
        short_name: 'Deconz-Ruler',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
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
