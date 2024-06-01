import 'vuetify/styles'

import '@mdi/font/css/materialdesignicons.css'

// Ensure you are using css-loader

// Labs
// https://next.vuetifyjs.com/en/labs/introduction/
import * as labs from 'vuetify/labs/components'

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import VuetifyUseDialog from 'vuetify-use-dialog'

import BundleEditorFiles from '../components/bundle-editor/bundle-editor-files.vue'

import type { UserModule } from '~/types'
import { storageKey, storageSchema } from '~/machines/app'

// #region Default theme
let defaultTheme = 'dark'
const saved = localStorage.getItem(storageKey)
if (saved) {
  const parsed = JSON.parse(saved)
  const data = storageSchema.parse(parsed)

  defaultTheme = data.settings?.darkTheme === false ? 'light' : 'dark'
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
