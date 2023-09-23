import 'vuetify/styles'

import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

// Labs
// https://next.vuetifyjs.com/en/labs/introduction/
import * as labs from 'vuetify/labs/components'

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import VuetifyUseDialog from 'vuetify-use-dialog'

import BundleEditorFiles from '../components/bundle-editor/bundle-editor-files.vue'

import { type UserModule } from '~/types'

// Import Vuetify
export const install: UserModule = ({ app }) => {
  const vuetify = createVuetify({
    components: {
      ...labs,
      // YSwitchLang,
      BundleEditorFiles,
    },
    theme: {
      defaultTheme: 'dark',
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
  })

  app.use(vuetify)
  app.use(VuetifyUseDialog)
}
