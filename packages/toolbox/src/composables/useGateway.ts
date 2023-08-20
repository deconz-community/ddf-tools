import type { Ref } from 'vue'
import { assign, createMachine, interpret } from 'xstate'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { Gateway } from '@deconz-community/rest-client'
import { inspect } from '@xstate/inspect'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const deviceMachine = createMachine({
  id: 'device',
  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen0,
  schema: {

  },
})

const defaultGatewayContext: {
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
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBmAJwA6AEwAWRVsUBWAGx75ARlVH5AGhA5EigOzLbt+evUAOLotfquR-QF8-S1QMbHwAUQhRKloIBmY2Tl5JIRExCSRpRCM9Vz1lPXUjVy87I0UDS2sEdXlXZX0NPQ0teVtddQCgslDlJnpRPClYNDJlFAAzDGoACh0uLgBKPGCsXF7+tG4+DJTRJnFJGQRZbJVXVVsdWz0feR0zAsrEVVUVIyLFD6-i206QFZ6lHE9DAlGY9CgeAg4jA6wAboIANawgFrIH0EFgvpQBB9BGUdD7ehbLbJYR7A4ZI6yOZ1IpGFyKO6OJmKJ4IeSqLhqRTqJpOc7nGryP6onDKdGY8GQ6Eg+FIlHdNHA0HS3H0fGE8QkozbATktKHOSmeT5Jw3QzeUxXWzslzqZTyQwlYyuIy2d6ipXiyWq7FQmHy5HKMUSlVYiHqzVpEmqPUgXaGqnG7KOnKfYpW3yOdk6C7KPm1HQ6dSmHJ6X6Bf7esMYv0QgNyvEKkM130RnHNgkx3gceTxxNEo3HIo6fJXTxmLM29l6EzKcpFktl3KVrohNbiVh9WFMCCsMB4ABKYHGtFgAAtyLE4UxKHBSTsDUPkyOuKo8h5fK45oouE7snZV57Dzd5bBcPR2i4PQvQ3cUtx3Xp90PIYRgwMZJjAGYjHmXD5iWUMEKbZDH31VIX1AakcPfep2TuMdQPdCCoJgqtCPobc5QABUEQROKga8wFve9YEbXcNRbdjONhHi+OxQThLgKNBG7IkSSSJ9yMpSi5Bw15HU8GpLlzf96lMJi+RY2DVng8ZxmkvAAGFw02DSyIpdIdI5eRTQ8Vp3HuS5bDdOibmULhXHAuZrlyUc12rODlEEOzpOULDqEEahlAAV3oWgUEoC8UAAIwPPAIiiGg6EYFh2FIhNn20zIEDsblilUH9skij85ztUsDK0XI3VcJR1HiwiUsQ9LMvhNg93IABBLiAElyGRcJIjQaJqviOq3IarTPOa1rlHazqclsHqjFzVQx00LRHAMYwTWsnpkvsqbqAyrLcsRehBEwehys27bYhqhJ6sHJqjhOs77guq7ZxwhdtEUV5TE+d9Xs3Sa5UgPYG1lWFhlGCaPrxzbsUhxqjphn9Ts+NpWi4HQfK8ICrgXZ1i1LLqKxFNia3e1L8elZQltW9a8AAOTAKRXIHGnhwZNw1D0fRi0Cq4QqsRArlNVodGx2zydhUXsXFla1rAfAuNoW9BGyxJFcO5WyjqIKvHkHxPeu3XqkitRwJaVxyjcFxjaS3GzcpiFxYgCBz1E2X5ep13XxVuoPw14t3W1v2qjcewLnu2ow68Do-n+2J4AyMUyXTryTlu01DA6kwdHZZGLmcDunF8fmBfXGz1lEBuPOHE5bG5OY8Ln+Y9C7rl6kj9tpXHpMm98Iw1YrC47BeQL1DoopwvMn9p5Gx7I6IsAN4o5rm5Z-JOTdW6u8MM+cN5WoOsi8ahYcUQnuA899oa6WzC-du79-Z3AdO+MCzESzQRvkA7ivF+IKTvHAMBtM5A-jHG3N+ndYEli-hZSCyDWLDzetHXBw4DDclusFGoPt84fzqLPFmmhnQGEuDfaOyhIiwBKgeCA9DXwegdMwr2bDgoF2eP4QWiVhafW+hIryl81Da1YXneRdEyGhy0DoK+JglBKJoTjU2aUvozVyvlQqoi76aQnpIz+0VZF6J1oXfqShtBlwKBXAR1jppZTxHNCAi0rbrQ0c1S4eQZG6N9jdBiwSRa2J+vQP6AMjpQzwQgRwY4Op-iZHI7xiA5xGDSVNWOUBYlHHeHMBwOjvZeIURyVmQdNAmNaGY3Q1CEoj1URTAmUBLaSxtvUrInId6eySew-2eYxyRSNsooZgjzZxwWgnJOUyEBmFMM0lhrTkn+xcNyRwpdQ6BIjms2hITanKAACIwj2WYUycyTkLKqHObkHcAgBCAA */
  id: 'gateway',
  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen1,
  schema: {
    context: {} as typeof defaultGatewayContext,
    events: {} as | {
      type: 'Edit credentials' | 'Done' | 'Next' | 'Previous' | 'Connect' | 'Refresh devices'
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

  context: structuredClone(defaultGatewayContext),

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
                'Edit credentials': '#gateway.offline.editing.Address',
              },
            },
            'invalid API key': {
              on: {
                'Edit credentials': '#gateway.offline.editing.API key',
              },
            },
            'unknown': {
              on: {
                'Edit credentials': '#gateway.offline.editing',
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

          onDone: 'disabled',
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

    'Edit credentials': '.offline.editing',
  },

}, {
  services: {

    connectToGateway: context => new Promise((resolve) => {
      // TODO Move this to the rest client package
      let resolved = false

      const queries = context.credentials.URIs.api.map(async (api) => {
        try {
          const gateway = Gateway(api, context.credentials.apiKey)
          const config = await gateway.getConfig()

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
      context.gateway?.getDevices().then((result) => {
        resolve(Ok(result.success!))
      })
    }),
  },
  actions: {
    useClient: assign({
      gateway: (context, event) => event.data.unwrap().gateway,
    }),
    updateCredentials: assign({
      credentials: (context, event) => event.data ?? structuredClone(defaultGatewayContext.credentials),
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

  inspect({ iframe: false })

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
