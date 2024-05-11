import type { EndpointAlias, ExtractParamsForAlias, RequestResultForAlias } from '@deconz-community/rest-client'
import type { MaybeRef } from 'vue'
import { gatewayRequest } from '~/machines/gateway'

export function useGateway(gatewayId: MaybeRef<string | undefined>) {
  const machines = createUseAppMachine()
  const gatewayMachine = machines.use(
    'gateway',
    computed(() => ({ id: toValue(gatewayId) ?? '' })),
  )

  function fetch<Alias extends EndpointAlias>(
    alias: Alias,
    params: ExtractParamsForAlias<Alias>,
  ) /* : Promise<RequestResultForAlias<Alias>> */ {
    return new Promise<RequestResultForAlias<Alias>>((resolve) => {
      gatewayMachine.send(
        gatewayRequest(alias, params, {
          onDone: (result) => {
            resolve(result as any)
          },
        }),
      )
    })
  }

  return reactive({
    fetch,
    send: gatewayMachine.send,
    state: computed(() => gatewayMachine.state),
    credentials: computed(() => gatewayMachine.state?.context.credentials),
    config: computed(() => gatewayMachine.state?.context.config),
    devices: computed(() => gatewayMachine.state?.context.devices),
    bundles: computed(() => gatewayMachine.state?.context.bundles),
  })
}
