import JsonViewer from 'vue-json-viewer/ssr.js'
import 'vue-json-viewer/style.css'

import { type UserModule } from '~/types'

// Setup Json Viewer
// https://www.npmjs.com/package/vue-json-viewer
export const install: UserModule = ({ app }) => {
  app.use(JsonViewer)
}
