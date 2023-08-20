import type { Ref } from 'vue'
import { assign, createMachine, interpret } from 'xstate'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { Gateway } from '@deconz-community/rest-client'
import type { GatewayCredentials } from '~/interfaces/deconz'

const defaultContext: {
  credentials: GatewayCredentials
  gateway?: ReturnType<typeof Gateway>
  devices_list: string[]
} = {
  credentials: {
    apiKey: '<nouser>',
    id: '<unknown>',
    name: '',
    URIs: {
      api: [],
      websocket: [],
    },
  },
  gateway: undefined,
  devices_list: [],
}

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBmAJwA6AEwAWRVsUBWAGx75ARlVH5AGhA5EigOzLbt+evUAOLotfquR-QF8-S1QMbBxlJnpRPClYNDJlFAAzDGoACh0uLgBKPGCsXHDItG4+JBAhETEJMpkEWSM9FVdVWx1bPR95HTM9dUtrBFVVFSMjV0UxifGx11sAoLJQ5UpxejBKZnooPAhxMEKAN0EAa328pZX6NY2IqAQIo8p0JnESkskK0Rfq0FrZDNcyjGRhcii6jjBin6iHkqi4akU6j0LXkzWa6nk8nmIHOBUu102212a0OJzOizxq3WhPu9Eez1evA4RlKAmEX3Ekj+pnkyj0Tg6hm8pjatmhCBc6mU8kMXjBwNso2xuLC+Optx2e1Jp2UKuWVJuW1p9Kqb1UrPK7KqXLkpj00r001cXi4Isc4p0LWUSNROh06jtrn5yopqoNhM1JIeZN1of1V3VRujT1NTPkFs+1pqcjGOj5bU8ZmFvndVkQehMykUsr9AYaQbmgRxcfErAi+yYEFYYGisXiSRSqSMmRHmRyetb7fCXbA7zKme+Nrqw9dyh04q6ec9o1sLka-q4ehDIQKk5JAAVBII21tyBAwAcmJQ4JGO3SYxP6Df9pfr7c7w+T5wMaggpt8by8B8VqLtmy6uioShePIrQelwvLbkYu5Iro3hHk2E6JIk354AAwuGc5spUMG-DCmLKB4yHuN0rS2K4Rgbh09GzOoGTtEGuaNgsJ5hIIhHfsoYDUNQgjUMoACu9C0CglAABYoAARt2eAAGJMFI5BMLAsBybOkHztBnKwXYgLOqorjdI6tiqAY7FlhKAbeiOLReA0qj+PhLZiVOknSbJDxsJ25AAILngAkuQpz4Lp+mGcZpkZhZPzSDYrHKLZSE+CxbEen5a7HvkIlBSSIUyfJ9DHPQgiYPQOl6QZRkmRRlpUZZNEIHY9gGMMQpaBkOiuOKFZGOVSyiURwUQF8WzKDF8WJXgAByYBSMUZmURyWW1CCGRqHo+h+sxbTFW5bS8s4bi2LoYxcE5WIBcJyhzeJkBLVAK1xQlYD4OetCPoIcmcHt3UHUuJiZA4V0YoVV2uQMD1qC4szOMd+hnTNp5VfsP2EitEAQLQRmbdtu0ZT1h2IMd8LOedfqYSj4roxoD3YzxuM6PjIlflOnZaQASmAiQUypAGPs+kO0zDsH1K69oeL49keGhFZ6OKwz2BhWH7rhARNo197wGUKpQXTS71H5vKGHZJjrm5siePRo6oiCjROYJzYfREojW4rfX1LY8IZKOUeZDrblw2V70VfGBK3MHWah74RinfyLR2EMzF9G5xiAq6oz2eHrjIe0AufULaxp9R2XLnCeaO2xfm68O9GmJhe44YeNdnh2M4N71Tf1CWfKwu3LsDF0Uql732EHnhQlJ0Pyi-jeUAy0BFv7en4-2a30-Oxu-rdzufcr4PhOj-TCAGEziPyMjrGozmEee2x2FOQYt-zRJItWAGluwQHvkuCEagX5v2ugMRwADvpSRkhA2CFdoGsSRmzd+58pTjG0KiasbgXCIOCsg2SCklKqVAWAVBfV2joRegVbBcDEAuFUNKbQYJxi9C8OoUh1VyGHAihAaKANEp0Kbq0e0flMGvxYR-BAnotwCKJkIhSDUmpZQXGPWojg8x2UUAxWBiipqqIkotQkkijq+A4UVLBRVFFdF5FzLG6gcYGH5onWahMLG-X+mtIG1iGawl5PY+RjiSp5j4bMJ67hXrmOJrcUm5M4D72hofI6oSEZyJMRzbwDhMZOHcbzTxiTLHJIACJ7GCQgMwXA8zhLyW5Cs8IPAPTiS9VQb0AhAA */
  id: 'gateway',
  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen0,
  schema: {
    context: {} as typeof defaultContext,
    events: {} as | {
      type: 'Fix issue' | 'Done' | 'Next' | 'Previous' | 'Connect' | 'Refresh devices'
    } | {
      type: 'Update credentials'
      data?: GatewayCredentials
    },
    services: {} as {
      connectToGateway: {
        data: Result<{
          gateway: ReturnType<typeof Gateway>
        }, {
          type: 'invalid_api_key' | 'unreachable' | 'unknown'
          message?: string
        }>
      }
      fetchDevices: {
        data: Result<string[], never>
      }
    },
  },

  context: structuredClone(defaultContext),

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
          target: 'online.Pooling devices',
          actions: ['useClient'],
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

    online: {
      states: {
        'idle': {
          on: {
            'Refresh devices': 'Pooling devices',
          },

          after: {
            10000000: 'Pooling devices',
          },
        },

        'Pooling devices': {
          invoke: {
            src: 'fetchDevices',
            onDone: {
              target: 'idle',
              actions: 'updateDeviceList',
            },
          },
        },
      },

      initial: 'idle',
      exit: 'cleanUpDevices',
    },

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
    'Update credentials': {
      target: '.connecting',
      actions: 'updateCredentials',
    },
  },

}, {
  services: {

    connectToGateway: context => new Promise((resolve) => {
      let resolved = false

      const queries = context.credentials.URIs.api.map(async (api) => {
        try {
          const gateway = Gateway(api, context.credentials.apiKey)
          const config = await gateway.client.getConfig()

          if (!config.success)
            throw new Error('No response from the gateway')

          if (config.success.bridgeid !== context.credentials.id) {
            return Err({
              api,
              type: 'unreachable',
              message: 'Bridge ID mismatch',
              priority: 20,
            } as const)
          }

          if (!('whitelist' in config.success)) {
            return Err({
              api,
              type: 'invalid_api_key',
              message: 'Invalid API key',
              priority: 30,
            } as const)
          }

          resolved = true
          resolve(Ok({ gateway }))
        }
        catch (e) {
          return Err({
            api,
            type: 'unreachable',
            message: 'No response from the gateway',
            priority: 10,
          } as const)
        }
      })

      Promise.allSettled(queries).then((queriesResult) => {
        if (resolved)
          return

        const error = queriesResult
          .map((result) => {
            if (result.status === 'fulfilled')
              return result.value
            return undefined
          })
          .filter(result => result !== undefined && result.isErr())
          .sort((a, b) => {
            return b!.unwrapErr().priority - a!.unwrapErr().priority
          })
          .shift()

        if (error)
          return resolve(error)

        return resolve(Err({
          type: 'unreachable',
          message: 'No response from the gateway',
        } as const))
      })
    }),

    fetchDevices: context => new Promise((resolve) => {
      context.gateway?.client.getDevices().then((result) => {
        resolve(Ok(result.success!))
      })
    }),
  },
  actions: {
    useClient: assign({
      gateway: (context, event) => event.data.unwrap().gateway,
    }),
    updateCredentials: assign({
      credentials: (context, event) => event.data ?? structuredClone(defaultContext.credentials),
    }),
    updateDeviceList: assign({
      devices_list: (context, event) => event.data.unwrap(),
    }),
    cleanUpDevices: assign({
      devices_list: [],
    }),
  },
  guards: {
    isOk: (context, event) => event.data.isOk(),
    // isErr: (context, event) => event.data.isErr(),
    isInvalidAPIKey: (context, event) => event.data.isErr() && event.data.unwrapErr().type === 'invalid_api_key',
    isUnreachable: (context, event) => event.data.isErr() && event.data.unwrapErr().type === 'unreachable',
  },
})

export function useGateway(credentials: Ref<GatewayCredentials>) {
  const id = computed(() => credentials.value?.id)

  // inspect({ iframe: false })

  // Create machine with credentials
  const machine = interpret(gatewayMachine.withContext({
    ...gatewayMachine.context,
    credentials: credentials.value,
  }), {
    id: `${gatewayMachine.id}-${id.value}`,
    devTools: true,
  })

  const state = ref(machine.initialState)
  machine.onTransition((newState) => {
    state.value = newState
  })

  machine.start()

  const handles = [
    registerNinja(machine),
    watch(() => state.value.context.credentials, (data) => {
      credentials.value = data
    }),
    watch(credentials, (data) => {
      machine.send({ type: 'Update credentials', data })
    }),
    () => machine.stop(),
  ]

  const destroy = () => {
    handles.map(handle => handle())
  }

  return {
    id,
    credentials,
    machine,
    state,
    destroy,
  }
}
