import { type UserModule } from '~/types'
import { createPocketBase, usePocketBaseSymbol } from '~/composables/usePocketbase'

export const install: UserModule = ({ app }) => {
  app.provide(usePocketBaseSymbol, createPocketBase())
}
