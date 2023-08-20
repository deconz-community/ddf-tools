import type { Ref } from 'vue'
import { assign, createMachine, interpret } from 'xstate'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { Gateway } from '@deconz-community/rest-client'
import { inspect } from '@xstate/inspect'
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
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBmAJwA6AEwAWRVsUBWAGx75ARlVH5AGhA5EigOzLbt+evUAOLotfquR-QF8-S1QMbBxlJnpRPClYNDJlFAAzDGoACh0uLgBKPGCsXHDItG4+JBAhETEJMpkEWSM9FVdVWx1bPR95HTM9dUtrBFVVFSMjV0UxifGx11sAoLJQ5UpxejBKZnooPAhxMEKAN0EAa328pZX6NY2IqAQIo8p0JnESkskK0Rfq0FrZDNcyjGRhcii6jjBin6iHkqi4akU6j0LXkzWa6nk8nmIHOBUu102212a0OJzOizxq3WhPu9Eez1evA4RlKAmEX3Ekj+pnkyj0Tg6hm8pjatmhCBc6mU8kMXjBwNso2xuLC+Optx2e1Jp2UKuWVJuW1p9Kqb1UrPK7KqXLkpj00r001cXi4Isc4p0LWUSNROh06jtrn5yopqoNhM1JIeZN1of1V3VRujT1NTPkFs+1pqcjGOj5bU8ZmFvndVkQehMykUsr9AYaQbmgRxcfErAi+yYEFYYDwACUwIlaLAABbkCBgA5MShwd5lTPfG11Iyu+0eXyuDKKLgyhri4b2T2jWwuRr+rh6EMhAqt9vhLs9mJxDAJZJgNLLzKf7K5Fv0NtR+9ZzZSoF2zJdMlUZQdHFLo80PIxjyRXRvAvJs9RvEkAAVBEEf8oDHCcpzgSMOzpGN0L-W9sNw24CMnadYGNQQU2+N5eA+K1QN+HNXRUJQvHkVoPW3KDTAQk9kPPS98jCQREkSf8ewAYXDIDLRAzkwMxXkPEE9xulaWxXCMGCOmULhZnUDJ2iDXNGwWK9ZPkxTlDfahBGoZQAFd6FoFBKGHFAACNuzwAAxJgpHIJhYFgLywDU+dNO4hA7EBZ1VA3etbFUAwTLLCUA29T8Wi8BpVH8NCW2c283I8w42E7cgAEFMIASXIU58AiqKYrihL2LnTjkukGwjOUDKssdHK8o9CqoOkpY5IU2rqHczyfOOehBEwehwsi6LYvixLhp+UbUscPlkWrZwtAyHRXHFCsjEW68apJSAvi2ZRWo6rq8AAOTAKRikG4COTO2oQQyNQ9H0P0DLaYyPScaUXFmXQxi4HKsSqxzlGWlzPsJH72s6sB8Ew2hJ0ELzODB9SIcXExMgcJGMR8QzkYKtx7A0XnnGh-Q4depyVo+iAvqgH6IAgIdYEB4HQYzU7mas+Fcvhv0EKR-KBl5tR0acdQhYMHRRYJ979mJjViX2WJ4nQq3XMlwkTo0yGbA3CaJlsMFbC4HRMS8Pc2irGt-UDflcabbbx3gMoVQ4j3F3qCreUMTKTGggrlzUY3DHBIwt2RVQLYiURk6ZsD6gDqCvwbz89HFFmFrxmT4wJW4q6zFL6m6WH+RaOwhgMvoCuMQFXVGDcA9cQT2gtjCwB7rjzrTwO+VhYyKpbwxzLExDTxQpfKIA7tV5Gv5RjDzOd5zgYuilafxKQs9UIcjvl+Uai8LooiE7g17uvDceY77Zxgv6A+R4JLvyXlbS+nsEAGA1uzeQnNdZ70BObduS1naS1gMFbsEBEGLkVFKCqRkOY6yMnrRAFUP7NnxoTVa61SFgTnmoNBGDaGQKlOMbQqJqxuBcPA8W1s1r1R8n5AKRCV5DRThw-e1kBI8O5vrIqShBHjF6F4dQYiiaSM8g8RqEAWpky6uwlKrR7SUNUTQ9RiBPRwQMawqR9Ato7TOklJBjg8yZS3GCNRdDkFKlwW9cRLspZWPOjfSCXNqFcxCV0Xk-NZiCyssLHBn88GRJtt9X65MBhALXlDWEvIEnoIcSE5xE0jaY3cDjVxEspYyzlnAQBjNgFlNUBU7h1TxQuHhIhdJJtMlm2adbV2txlAABE9gxLKZvSpwSnp5w8LzBp2NekBACEAA */
  id: 'gateway',
  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen0,
  schema: {
    context: {} as typeof defaultContext,
    events: {} as | {
      type: 'Fix issue' | 'Done' | 'Next' | 'Previous' | 'Connect' | 'Refresh devices' | string
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
