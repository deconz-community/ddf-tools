import type { Ref } from 'vue'
import { assign, createMachine, interpret } from 'xstate'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { inspect } from '@xstate/inspect'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBGLgA4AdEoCs89QDYATOq6Gj2gDQgciAMwB2AL62zqDNhwqm9UXimw0ZFSgAzDGoACgMuAEo8JyxcNw80bj4kECERMQkUmQRZay4VAE55ABYuPXCjMrMLBF1dS3tHMhcVSnF6MEpmeig8CHEweIA3QQBrQZiWtvoOrvcoBHcRynQmcSSkyTTRNczQbIUlVXklEuKCy3VrawuC6sRi+pVLc9LipRejy21GkEm46azbq9fodYZjCbNAHtTrAxb0Zarda8DjyZICYQ7cSSA66eQFQr1bRlF5cPFXaz3BDqPFqbSWJTnSwneTWeTyX7-VyA2HzPoDcHjFRc1owuY9eGIjIbXTo1KYjI4uR1XQqbQnIpHUrk65U4nFQr0jTqR7ybRKbR2Bx-KHcsXA-lgpYQ4W20UzXkS50raUoyxy7aKrJyfHyQpcG6nUk6ynmRDaAr5YpG9QmvHmy2ct2CAIBVjuMB4ADC9s2KUDuyVCEsNZUXAu1iUXE01iupyp33yymsxQM1gzJyuWeccRzeYLKjA1GogmowzYTAg5AAggAFACS5HG+AAYkwpOQmLBYABXMBljHpSvBhCKCNqyy6RmWListvyPVcBrWkVj-NgqcZznE96FGehBEweg8D3A8j1Pc9eC2BVr32RA720FRinkXQCnpc4CgMdQlD1I4VHUYdYlcP8J0gHYekdQYfD8X9c3-QZaOBC95SvbEbxKK4VDyd5cI0G5LAKWMakfA09EuAiXgTZkCgolpqIAiA6KgFQ103bc8AAOTAKREkQ8tkN41Db3UIoyK0bRUxbd89QMNRineG5NCbax6hU0dWJojTgW0jctzAfBV1oIY1hPThTMvLE9mkNCXlVQxG2KF830bD842pbQDR7dyXn4nQrSaEcqP89TNO0iAIFoY8DKMkyA3MxLsi0GzNB0BysvbXKdAKtylGsYre1K3zKvHADp1nFQQNoFBKAACxQAAjVhCxgw9jzPLiKwspLbzSh8n00c1vO0dUqU0AlE0MXR0rNfQfl+cCIDgSQuSQnj2rkS18iOJ9sPUKlZAKVRKgktlTXypRJviUQfoSqtcnyCpKkx0xcpKMNyJ-N0eXFKBkaDSyFE0FRdCu7ybm8-RWWKDsTjrPFBzyD5rle8rKJUcQ2NJlCjtkPRVSB059CpeQXjIhG1LAQXDuyeyDTS59X1bbKwcUMijHeUTFCUXRijKm0Kr5qrBg02B1s2iBFb+hBrgJfR0syzX+pqa45ctydZuoB2qzyVKI3VvqcpqDLVVKQwSj0RRxI5Anzflv2gPm+hFpW22FbM36g4E12w49iPEFutQCkri4lFw943J96b2P9+d8yXHTQpqeKyaO1su1DjKNac3LiW-HnVN9wC5pAsCIMSg7Hf7Akv0TC5B614fSPxse-MbydAvmQO+Jw1X+-dofI5fQThoKLDE-ZS4G7Yveavb7dD8suP1DrU+189+Mv2eMNDyJwIw+WTrzVOHF5i1XqnAeAecUZ8WTF-NWA9w43RZsbIqWFxqZnAePXeUCegqAACIDHfkdM41hv5u1-qXBAF0yI3xGgREB3lvz2CAA */
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
        data: Result<{
          api: string | null
          websocket: string | null
        }, 'invalid_api_key' | 'unreachable' | Error>
      }
    },
  },

  context: {
    credentials: {
      apiKey: '<nouser>',
      id: '',
      name: '',
      URIs: {
        api: [],
        websocket: [],
      },
    },
    uri_api: null,
    uri_websocket: null,
  },

  states: {
    init: {
      after: {
        500: 'connecting',
      },
    },

    connecting: {
      invoke: {
        src: 'connectToGateway',

        onDone: [{
          target: 'online',
          actions: ['useURIs'],
          cond: 'isOk',
        }, {
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

          onDone: '#gateway.connecting',
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
      if (Math.random() > 0.5)
        return Err('unreachable' as const)
      return Ok({ api: null, websocket: null })
    },
  },
  actions: {
    useURIs: assign({
      uri_api: (context, event) => event.data.unwrap().api,
      uri_websocket: (context, event) => event.data.unwrap().websocket,
    }),
  },
  guards: {
    isOk: (context, event) => event.data.isOk(),
    // isErr: (context, event) => event.data.isErr(),
    isInvalidAPIKey: (context, event) => event.data.isErr() && event.data.unwrapErr() === 'invalid_api_key',
    isUnreachable: (context, event) => event.data.isErr() && event.data.unwrapErr() === 'unreachable',
  },
})

export function useGateway(credentials: Ref<GatewayCredentials>) {
  const id = computed(() => credentials.value?.id)

  /*
  const machine = useInterpret(gatewayMachine, {
    id: `${gatewayMachine.id}-${id.value}`,
    devTools: true,
  })
  */

  const state = ref(gatewayMachine.initialState)

  inspect({
    // options
    // url: 'https://stately.ai/viz?inspect', // (default)
    iframe: false, // open in new window
  })

  const machine = interpret(gatewayMachine, {
    id: `${gatewayMachine.id}-${id.value}`,
    devTools: true,
  }).onTransition((newState) => {
    state.value = newState
  }).start()
  registerNinja(machine)

  /*
  const machine = useNinjaMachine(gatewayMachine, {
    // id: `${gatewayMachine.id}-${id.value}`,
    devTools: true,
  })
  */

  // registerNinja(service)

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
    state,
    data,
    connect,
    destroy,
  }
}
