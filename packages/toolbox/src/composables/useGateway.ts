import type { Ref } from 'vue'
import { assign, createMachine, interpret } from 'xstate'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { Gateway } from '@deconz-community/rest-client'
import type { GatewayCredentials } from '~/interfaces/deconz'

const defaultContext = {
  credentials: {
    apiKey: '<nouser>',
    id: '<unknown>',
    name: '',
    URIs: {
      api: [],
      websocket: [],
    },
  },
  uri_api: null,
  uri_websocket: null,
}

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBmAJwA6AEwAWRVsUBWAGx75ARlVH5AGhA5EigOzLbt+evUAOLotfquR-QF8-S1QMbBxlJnpRPClYNDJlFAAzDGoACh0uLgBKPGCsXHDItG4+JBAhETEJMpkEWSM9FVdVWx1bPR95HTM9dUtrBFVVFSMjV0UxifGx11sAoLJQ5UpxejBKZnooPAhxMEKAN0EAa328pZX6NY2IqAQIo8p0JnESkskK0Rfq0FrZDNcyjGRhcii6jjBin6iHkqi4akU6j0LXkzWa6nk8nmIHOBUu102212a0OJzOizxq3WhPu9Eez1evA4RlKAmEX3Ekj+pnkyj0Tg6hm8pjatmhCBc6mU8kMXjBwNso2xuLC+Optx2e1Jp2UKuWVJuW1p9Kqb1UrPK7KqXLkpj00r001cXi4Isc4p0LWUSNROh06jtrn5yopqoNhM1JIeZN1of1V3VRujT1NTPkFs+1pqcjGOj5bU8ZmFvndVkQehMykUsr9AYaQbmgRxccEiUSrAiYDwAGFw+8ypnvjaEJjeR55LZ3N1WpOjOKZfCuLN1Bl2kHc42FiECq3253lGBqNRBNRDmwmBByABBAAKAElyKd8AAxJhSchMWCwACuYH7bMqIdswQOxAWdVQvHkHwZ1cOcywQT08x0ENtzCXcOxJQ9j1Pb96GOehBEweg8Ffd9Px-P9eA+K0gN+GxHD5ZFq2cLQMh0VxxQrIwUPyNC2ww-ZIC+LZlFvB8nzwAA5MApGKKiBxozlgJBDI1D0fQ-WnNpYI9JxpRcWZdDGLhbFULEmz1dD9yEwlRPvR8wHwG9aAOF5v04eSAI5H5pEQExMgcbSMWg7S4IGNx7A0CLnBU-R1J4pYrMwiBhKgUSIAgWgvykmS5IzRSfNqFT4VUdT1L9IwYLCxAIrUAynHUWKDGQiyW346yjxPZRcNoFBKAACxQAAjVgu1Ij8v1-f9LUApS6JAydlHA1xukdUyDGqiUA29TJXUnRrkX8bECIgOBJBVajZsKuRYJUQwIJMHRxVkTwEoKCJREu7zh3qWx4QyXbAcBvRxX85QWq3Xj4wJW4vqzeb6m6NT+RaOwhmnPp4OMQFXVGFa-tcCd2jetD6AEuHaN8upHCMPlYVg1QnqxxrwdMSqkS0WxNGrEnlCSsAKbmqmDBKoKoMq0LnqMf7ef55QUtgYbRogQXroQCE1DFkLZ3FRxZfazDOuoVXhwJzX9vFqr539KtdpBZFpaUbjWtQvmDcEo3uvoXqBqVgWFKu03DHBkzIO1nT4JcVRpW0MFxl6Lx1H1vdDews8O0vMSHIGLz4ap1p7UZi3w82xDweTgSD093D8MInzByF2pHDzCDFHHEvOKVF2oblmzYYD77lN8aOYOCiWdaxnReSirwGgyRnkT0CvrJS2ys6fE3lNhXlR8tyX4LLxPDO6dxTPMyHEvdg9V9udLMrgeAB7zort8C4vx4j8LvAceqYpXOKIbNldr3G+IkAAiexN7zTMFwPMu8O7wQrIuREx9jJnwCAEIAA */
  id: 'gateway',
  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen0,
  schema: {
    context: {} as {
      credentials: GatewayCredentials
      uri_api: string | null
      uri_websocket: string | null
    },
    events: {} as | {
      type: 'Fix issue' | 'Done' | 'Next' | 'Previous' | 'Connect'
    } | {
      type: 'Update credentials'
      data?: GatewayCredentials
    },
    services: {} as {
      connectToGateway: {
        data: Result<{
          api: string | null
          websocket: string | null
        }, {
          type: 'invalid_api_key' | 'unreachable' | 'unknown'
          message?: string
        }>
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
          const client = Gateway(api, context.credentials.apiKey)
          const config = await client.client.getConfig()

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
          resolve(Ok({
            api,
            websocket: context.credentials.URIs.websocket[0],
          }))
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
  },
  actions: {
    useURIs: assign({
      uri_api: (context, event) => event.data.unwrap().api,
      uri_websocket: (context, event) => event.data.unwrap().websocket,
    }),
    updateCredentials: assign({
      credentials: (context, event) => event.data ?? structuredClone(defaultContext.credentials),
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
