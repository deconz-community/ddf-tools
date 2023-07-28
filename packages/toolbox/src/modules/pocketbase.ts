import { type UserModule } from '~/types'
import { createPocketBase, usePocketBaseSymbol } from '~/composables/usePocketbase'

// Setup Json Viewer
// https://www.npmjs.com/package/vue-json-viewer
export const install: UserModule = ({ app }) => {
  app.provide(usePocketBaseSymbol, createPocketBase())
}
