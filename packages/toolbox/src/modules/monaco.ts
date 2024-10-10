import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'

import type { UserModule } from '~/types'

// Setup Monaco Editor
// https://www.npmjs.com/package/@guolao/vue-monaco-editor
export const install: UserModule = ({ app }) => {
  app.use(VueMonacoEditorPlugin, {
    paths: {
      // The recommended CDN config
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs',
    },
  })
}
