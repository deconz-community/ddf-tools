import type { Ref } from 'vue'
import { assign, createMachine } from 'xstate'
import { useMachine } from '@xstate/vue'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBGLgA4AdEoCs89QDYATOq6Gj2gDQgciAMwB2AL62zqDNhwqm9UXimw0ZFSgAzDGoACgMuAEo8JyxcNw80bj4kECERMQkUmQRZay4VAE55ABYuPXCjMrMLBF1dS3tHMhcVSnF6MEpmeig8CHEweIA3QQBrQbb6Dq6kyTTRJnFJbNlikpV5eV0C7XltUqVtbXVqq22Vfd0tDV1DAt07BxAYlsnp7t6wampBahUiVjoAK-AC2rXanUSvDmwgWSyyiEU6hUtwKSmsxWs8msNmKxSUpwQlnOl2u6luXHujyazjib0h7k+31+-0BaGB1DB9Jm8mSAlhGWWiA0hSUpUs2iUVylBWspnMiFK2hU6gle2s6kxml0Skaz2adIhXUZeC+Pz+AKBoPBU0hHF0fNSAsWmVA2U21hUxUsBnkSllDyUli4lkJxXuKhDu20Gq1W2p+tprkEAQCrHcYDwAGEjVDHfNBQiidYCpGCjYlFxNBrrEp5IT5Pc9S84im0xmVGaWQBXei0FCUAAWKAARqxMwAxJhSchMWCwbtgWYpAsuoUIJGWC7EsXB7HqWv1hVEq5qArn8v+-Zi4rNg3J1Ppjqd5l-dxDNhMCDkACCAAUAElyHGfApxnOcFyXaEV2deE3URKst20HdvS4fdDzDKs7yTFQ2yfQYuz+XtRnoQRMHoPAwNnedF2Xfl0jXItN23HVUPQuswwKfJ1Gw2IH3bZ9IAWHo+gGFQfD8Ft+PwzsIGEqA6KdBi4OkBD1FLYori49RqwPDjjxKLceKeKTcMfDshI+FR-yAkC8AAOTAKQ8xhZTXVUjdtRVLRjh09ijxqYpyRUGxjJpPizIEgi5KsmzgLAfA-1oIZFm7ThoPouF3PdXRkMjLhazYmt9JqCVlQecNLx2fE8V4lo8IsmLGWsiAIFoecHKclyYLc9ctC2bydB03SMOPMqUQxc9LCvGrbz1UiIDgSQpNcrL11kGN8iUKU630QlZDRfLDFueRLB2Ax1LquJ3FEVbC3gnI8hVSoXuMBs1hVK7XG5D47sYh6FE0FEjmsB4A30bFikJSw-UjK4-QPZQbDlL7cPofC-pUlY9F0NQdq2E4DMsYpPpM+9Ioxnq1qLHF8kMQq92KgK5EUZ7jr0oNtuDBNTIa585NgUdxwgTHssQawSxRPSir05mEAl1G+YI19RfXCXVHp3c0KZwl6hJs7z0lRRKx2MpFfMwTXxUXt+yHIWwFVosgy3fQGe12XodPf0L2m6qb3NqKX3NYZP2-OKQMdh6pWVTWZdGwKsLJnClaDnt6BIsj3NXLHhSCyMzspRmPePcNuIDmTLMZSOPK2LR8rd-zdeJCbKoKTVyTqeRy8a+TrMA+Kaky+6a+mmOCq1xuS64En0TCxMIpTyuehatq4HgKnh-dUf64nnWxsbFQJcq33r1qpOF4t6Le4AEQGaut8lHe45KxV-Q2fR7HsIA */
  id: 'gateway',
  predictableActionArguments: true,

  tsTypes: {} as import('./useGateway.typegen').Typegen0,
  schema: {
    context: {} as {
      credentials: GatewayCredentials
      uri_api: string | null
      uri_websocket: string | null
    },
    services: {} as {
      connectToGateway: {
        data: {
          api: string
          websocket: string
        }
      }
    },
  },

  states: {
    init: {
      after: {
        500: 'connecting',
      },
    },

    connecting: {
      invoke: {
        id: 'connect',
        src: 'connectToGateway',
        onDone: {
          target: 'online',
          actions: ['useURIs'],
        },

        onError: [{
          target: 'offline.error.unreachable',
          cond: 'isUnreachable',
        }, {
          target: 'offline.error.invalid API key',
          cond: 'isInvalidAPIKey',
        }, 'offline.error.unknown'],
      },
    },

    online: {},

    offline: {
      states: {
        disabled: {},

        error: {
          states: {
            'unreachable': {
              on: {
                'Fix issue': '#gateway.offline.editing.Address',
              },
            },
            'invalid API key': {
              on: {
                'Fix issue': '#gateway.offline.editing.API key',
              },
            },
            'unknown': {
              on: {
                'Fix issue': '#gateway.offline.editing',
              },
            },
          },

          initial: 'unknown',
        },

        editing: {
          states: {
            'API key': {
              on: {
                Next: 'Done',
                Previous: 'Address',
              },
            },

            'Address': {
              on: {
                Next: 'API key',
              },
            },

            'Done': {
              type: 'final',
            },
          },

          initial: 'Address',

          onDone: '#gateway.init',
        },
      },

      initial: 'disabled',

      on: {
        Connect: 'connecting',
      },
    },
  },

  initial: 'init',

  on: {
    'Update credentials': '.init',
  },

}, {
  services: {
    connectToGateway: async (context, event) => {
      return { api: '', websocket: '' }
    },
  },
  actions: {
    useURIs: assign({
      uri_api: (context, event) => event.data.api,
      uri_websocket: (context, event) => event.data.websocket,
    }),
  },
  guards: {
    isInvalidAPIKey: () => false,
    isUnreachable: () => false,
  },
})

export function useGateway(credentials: Ref<GatewayCredentials>) {
  const id = computed(() => credentials.value?.id)

  const machine = useMachine(gatewayMachine, {
    id: `${gatewayMachine.id}-${id.value}`,
    devTools: true,
  })

  registerNinja(machine.service)

  // const id2 = toRef(credentials.value, 'id')

  const data = ref({})

  const connect = () => {

  }

  // Delay the connection for 1.5 seconds.
  const { stop } = useTimeoutFn(() => {
    connect()
  }, 100)

  const destroy = () => {
    stop()
  }

  return {
    id,
    credentials,
    machine,
    data,
    connect,
    destroy,
  }
}
