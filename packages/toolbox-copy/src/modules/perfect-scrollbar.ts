import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'

import type { UserModule } from '~/types'

// Setup Perfect Scrollbar
// https://github.com/mercs600/vue3-perfect-scrollbar
export const install: UserModule = ({ app }) => {
  app.use(PerfectScrollbarPlugin)
}
