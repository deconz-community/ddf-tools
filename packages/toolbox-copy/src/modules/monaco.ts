import { install as VueMonacoEditorPlugin, loader } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'

import type { UserModule } from '~/types'

// Setup Monaco Editor
// https://www.npmjs.com/package/@guolao/vue-monaco-editor
export const install: UserModule = ({ app }) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    ...monaco.languages.json.jsonDefaults.diagnosticsOptions,
    enableSchemaRequest: true,
  })

  loader.config({ monaco })
  loader.init()

  app.use(VueMonacoEditorPlugin, {})
}
