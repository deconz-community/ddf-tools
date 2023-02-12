import 'vuetify/styles/main.sass'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

// Labs
// https://next.vuetifyjs.com/en/labs/introduction/
import * as labs from 'vuetify/labs/components'

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import { type UserModule } from '../types'

// Import Vuetify
export const install: UserModule = ({ app }) => {
  const vuetify = createVuetify({
    components: {
      ...labs,
      // YSwitchLang,
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
}
