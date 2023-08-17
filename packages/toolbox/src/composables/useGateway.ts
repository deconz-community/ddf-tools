import type { Ref } from 'vue'
import { assign, createMachine } from 'xstate'
import { useMachine } from '@xstate/vue'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBGLgA4AdEoCs89QDYATOq6Gj2gDQgciAMwB2AL62zqDNhwqm9UXimw0ZFSgAzDGoACgMuAEo8JyxcNw80bj4kECERMQkUmQRZay4VAE55ABYuPXCjMrMLBF1dS3tHMhcVSnF6MEpmeig8CHEweIA3QQBrQZiWtvoOrvcoBHcRynQmcSSkyTTRNczQbIUlVXklEuKCy3VrawuC6sRi+pVLc9LipRejy21GkEm46azbq9fodYZjCbNAHtTrAxb0Zarda8DjyZICYQ7cSSA66eQFQr1bRlF5cPFXaz3BDqPFqbSWJTnSwneTWeTyX7-VyA2HzPoDcHjFRc1owuY9eGIjIbXTo1KYjI4uR1XQqbQnIpHUrk65U4nFQr0jTqR7ybRKbR2Bx-KHcsXA-lgpYQ4W20UzXkS50raUoyxy7aKrJyfHyQpcG6nUk6ynmRDaAr5YpG9QmvHmy2ct2CAIBVjuMB4ADC9s2KUDuyVCEsNZUXAu1iUXE01iupyp33yymsxQM1gzJyuWeccRzeYLKjA1GogmoKgArvRaChKAALFAAI1YhYAYkwpOQmLBYPOwGWMelK8GEIoI2rLLpGZYuKy2-IqZoCUoCj+Lt-tO8xTFMOsSuGO+ZglOM5zksbBMBA5AAIIAAoAJLkOM+B7geR4nmevBbAqV77Igt7WPej7FM+r6Nu+cYIMSDTWiK4ETlBs4LvQoz0IImD0Hg2GHsep7nvKl7Ytet7aCoxTyLoBT0ucBQGOoSh6kcKjqCBLSsZBEA7D0jqDD4fgsbmEGDJABlQKJFYSSRN69uReTvApGg3JYBSxjUD4GnolzKS8CbMgU2mjuZbH6cCKgoehmF4AAcmAUiJAR5ZEfZ0ikeoRSaVo2ipi2b56gYahAUoNyaE21j1GFYERXp1kxWhGFgPgyG0EMazzpwaUXliexZTeLyqoYjZUS+ra0R+AEqD27zWC8JSppmzHZg1llRfMMUQBAtDHolyWpQGGWDdkWi5ZoOiFTR7b0ToBrzRVS29joVrWjxEBwJIXKEeJZ1yJa+RHI+cnqFSsgFEodXxKIf0DVWuT5BUlSo6Y9ElGGWlrSOdoeuKUDw0GDkKJoKi6Nolq6DcNX6KyxQdicdZ4oOeQfNcPw46BKjiBZRPEUNsh6KqIOnPoVLyC8mkw7pYD85l2QFQaY1PpNxX0QoyMyxtKj6bAm7bhA8sAwg1wEvo43UVNd01Nc2vjpB06zsbVZ5KNEaq7ddE1FRqqeb+DIKYBwFczpOvsXOi7LmuBty+l-2u1c5NthNXsfviai-n+QeMiHTS4zz4dOzBCJwQhsWtTU-XE0NrZdh7qfW978ZcEx+fc7Lk7F5x3G8YNdkm-2BKt4mFxq9N9Hmqo2Pt2HDubdZLuSfJysN1b6s+8+c3lYtsmvZTM82gXndWdFFeYUvDklAVdZr+PNst5Yzw78pJwRrVofhfPk5bT0O17XAeA8cEaSWTOoW+lt77N2pEzXQO8XorStLPL+Fkf5NQACIDEvkNM45EVaNw3vGCqmkCgLVftVD+9ggA */
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
            'unreachable': {},
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
