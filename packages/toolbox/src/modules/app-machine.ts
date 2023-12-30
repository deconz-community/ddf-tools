import type { UserModule } from '~/types'

export const install: UserModule = ({ app }) => {
  const machinePlugin = createAppMachine()
  app.use(machinePlugin)
}
