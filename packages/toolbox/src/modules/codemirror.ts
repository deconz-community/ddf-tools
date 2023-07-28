import { basicSetup } from 'codemirror'
import VueCodemirror from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'

import { oneDark } from '@codemirror/theme-one-dark'

import { type UserModule } from '~/types'

// Setup Json Viewer
// https://www.npmjs.com/package/vue-json-viewer
export const install: UserModule = ({ app }) => {
  app.use(VueCodemirror, {
    // optional default global options
    autofocus: false,
    disabled: false,
    indentWithTab: true,
    tabSize: 2,
    placeholder: 'Code goes here...',
    extensions: [basicSetup, javascript(), json(), markdown(), oneDark],
    // ...
  })
}
