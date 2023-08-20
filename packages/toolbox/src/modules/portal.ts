import PortalVue from 'portal-vue'
import { type UserModule } from '~/types'

// Setup Portal
export const install: UserModule = ({ app }) => {
  app.use(PortalVue)
}
