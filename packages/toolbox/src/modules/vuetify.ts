import type { UserModule } from '~/types'

import { createVuetify } from 'vuetify'

// Ensure you are using css-loader

import VuetifyUseDialog from 'vuetify-use-dialog'

import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Labs
// https://next.vuetifyjs.com/en/labs/introduction/
import * as labs from 'vuetify/labs/components'
import { storageKey, storageSchema } from '~/machines/app'

import BundleEditorFiles from '../components/bundle-editor/bundle-editor-files.vue'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// #region Default theme
let defaultTheme = 'dark'
const saved = localStorage.getItem(storageKey)
if (saved) {
  try {
    const parsed = JSON.parse(saved)
    const data = storageSchema.parse(parsed)

    defaultTheme = data.settings?.darkTheme === false ? 'light' : 'dark'
  }
  catch (e) {
    localStorage.removeItem(storageKey)
    console.error(e)
  }
}
// #endregion

// Import Vuetify
export const install: UserModule = ({ app }) => {
  const vuetify = createVuetify({
    components: {
      ...labs,
      // YSwitchLang,
      BundleEditorFiles,
    },
    theme: {
      defaultTheme,
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
