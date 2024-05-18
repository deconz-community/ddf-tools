import { waitFor } from 'xstate'
import type { UserModule } from '~/types'

export const install: UserModule = ({ router }) => {
  router.beforeEach(async (to, from) => {
    /*
    const gatewayID = to.params.gateway
    if (typeof gatewayID !== 'string')
      return true

    const machineTree = inject(appMachineSymbol)!

    const gatewayMachine = machineTree.value.gateways.get(gatewayID)

    if (!gatewayMachine)
      return true

    const loggedInState = await waitFor(gatewayMachine, state => state.matches('online'), {
      // timeout: 300,
    })

    console.log(loggedInState.context.config)

    console.log({ loggedInState })

    if (typeof to.meta.requireAPI === 'string')
      console.log('requireAPI', to.meta.requireAPI)

    console.log(to.meta)

    console.log('beforeEach', to, from)
    */
  })
}
