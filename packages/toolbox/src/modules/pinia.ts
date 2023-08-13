import { createPinia } from 'pinia'
import PersistedState from 'pinia-plugin-persistedstate'
import { type UserModule } from '~/types'

// Setup Pinia
// https://pinia.esm.dev/
export const install: UserModule = ({ app }) => {
  const pinia = createPinia()
  pinia.use(PersistedState)
  app.use(pinia)
}
