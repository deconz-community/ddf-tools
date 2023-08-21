import type { Ref } from 'vue'
import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, interpret, spawn } from 'xstate'
import type { Result } from 'ts-results-es'
import { Ok } from 'ts-results-es'
import { FindGateway } from '@deconz-community/rest-client'
import type { FindGatewayResult, Gateway, Response } from '@deconz-community/rest-client'
import type { GatewayCredentials } from '~/interfaces/deconz'

export interface deviceContext {
  id: string
  gateway: ReturnType<typeof Gateway>
  data: Response<'getDevice'>['success']
}

export const deviceMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTANwJYGMwDp0QBswBiAD1gBcBDC3KgM1oCcAKAZgAYuuBKYlDNjyEwAbQ4BdRKAAOAe1joK6OQDtpIUogBMARl05dAVgBs2owBoQAT0S6uAXwdWBWXPTAVMAC3Sqo-Gq4fqhyANa4rkIeXr7+CCFymDQqquIS6RryispqGloIALScOEYA7AAcuuZWtgh6ACw4ZWVsDWxlRk4uaG44MT5+AWBMTHJMODIENPTjALY4Ue6eg-GJyblpkplIINlKqfmIbBUmOACcHZY2Oh2lTs4gqnIo8LtLWQoHebsFhZWlSrVa51fTdEBLYRET45Q6-RD-HAmXRlXQVTq1RDnCr3R6QgZxKAw77qeEIFFNIxsYGY+rVXE9QS4EZjJjEzZHBBGCpNE7aKo1G71NgmB4OIA */
  id: 'device',

  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen0,

  schema: {
    context: {} as deviceContext,
    services: {} as {
      fetchData: {
        data: Response<'getDevice'>
      }
    },
  },

  states: {
    idle: {
      after: {
        300000: 'fetching',
      },
    },

    fetching: {
      invoke: {
        src: 'fetchData',

        onDone: {
          target: 'idle',
          actions: 'saveData',
        },

        onError: 'error',
      },
    },

    error: {},
  },

  initial: 'fetching',
}, {
  services: {
    fetchData: context => context.gateway.getDevice({
      params: {
        deviceUniqueID: context.id,
      },
    }),
  },
  actions: {
    saveData: assign({
      data: (context, event) => event.data.success,
    }),
  },
})

export interface gatewayContext {
  credentials: GatewayCredentials
  gateway?: ReturnType<typeof Gateway>
  devices: Record<string, ActorRefFrom<typeof deviceMachine>>
}

const defaultGatewayContext: gatewayContext = {
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
  devices: {},
}

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiALQBmAJwA6AEwAWRVsUBWAGx75ARlVH5AGhA5EigOzLbt+evUAOLotfquR-QF8-S1QMbHwAUQhRKloIBmY2Tl5JIRExCSRpRCM9Vz1lPXUjVy87I0UDS2sEdXlXZX0NPQ0teVtddQCgslDlJnpRPClYNDJlFAAzDGoACh0uLgBKPGCsXF7+tG4+DJTRJnFJGQRZbJVXVVsdWz0feR0zAsrEVVUVIyLFD6-i206QFZ6lHE9DAlGY9CgeAg4jA6wAboIANawgFrIH0EFgvpQBB9BGUdD7ehbLbJYR7A4ZI6yOZ1IpGFyKO6OJmKJ4IeSqLhqRTqJpOc7nGryP6onDKdGY8GQ6Eg+FIlHdNHA0HS3H0fGE8QkozbATktKHOSmeT5Jw3QzeUxXWzslzqZTyQwlYyuIy2d6ipXiyWq7FQmHy5HKMUSlVYiHqzVpEmqPUgXaGqnG7KOnKfYpW3yOdk6C7KPm1HQ6dSmHJ6X6Bf7esMYv0QgNyvEKkM130RnHNgkx3gceTxxNEo3HIo6fJXTxmLM29l6EzKcpFktl3KVrohNbiVh9WFMCCsMB4ABKYHGtFgAAtyLE4UxKHBSTsDUPkyOuC9lO4dJ93i4rl52XkeZ6lMd0XD0douD0L0N3FLcd16fdDyGEYMDGSYwBmIx5hw+YllDeCmyQx99VSF9QGpbD33qQC50dbMIKgwo7ndGDVjg+htzlAAFQRBC4qBrzAW971gRtdw1FtxjANBKAvAARYS7wfJInzIykKLkbDXDHJQvFaHQ7S0ED3lscDIOgqsCPGcYuMPABhcNNlU0iKXSTSOXkU0PFaL93X-IxaO5LhXDMuZrlyUc12rWDlEEGy7OUTDqEEahlAAV3oWgUDklAACMDzwCIohoOhGBYdgSITZ8NMyBA7G5YpVB07JQtUAxAqsRAXFUR1tFyN1XCUdRous2yEOS1L4TYPdyAAQW4gBJchkXCSI0GiMr4kqlzqvU9y6oaz9BXuHJbHaudc1UMdNC0RwDGME02J6eLxrlSa0syxF6EETB6CK9bNticqEiqwdaqOI6mpas6Ls6qo525bQtFeUxPnfZ7NwSib1v9WVYWGUYxsSyA9ghMGaoOyGdM-T42laLgdC8gCuoQa77EXHTl1aisRSsmtXpJ3GIWUBbltWvAADkwCkZyB0p4cGTcNQ9H0Yt7kuWw3VzJxHUuTG4Ox97hagUWlpWsB8G42hb0EdLEnl-bFbKOpNf0nw3fh7rQrUMyWlcco3BcA24qN2FSelUWIAgc8xOl2WKad18lbqdq1eLfyta96ofYuW7akDrwOj+H7YngDIxTJJOPJOa6HUMZqTEM1nsN95w3A8LwfGLRQQ76UQq7c4cTlsbk5lwif5j0dkTDHkP22lQekxr3wjBVisLjsF4NfUQCimUd93h00ehvukPCLAJfyLq2uoPyTk3WumeDAP0CdEzICIKG8-OIQvcDyvhDLSvg6gN0fs3KoQEx5vw-lBTwP9Eq8X4tiISIk4CAKpnIc49gwFNz3nULQqsXBOhGtkUaAsw4YOHAYbk7N3aZ21i3HI9Rz5h2UJEWA+UDwQCoa+D0Do6E1A9gFdk11LLrnYqHN64dqApWoLwjyJ81D-iEQw7OdwHQB0IV5LWigoLXVYdIpKsipqZWyrlAql81JDz4YYeoXAtaqM9naUsfVtAFwKEXQxJMTFpTxDNCA81zarQUXVS4eRBFATUVdMcOhvETV8Rleg31foHXBpghAjgxzNT0UyYRWdZyen5rFQWOMyZQFCUcd4cwHAqKic41mdxTR50XL5PRTQ4nFMkaU425Szbi0tpUrInI15uycSI1meYxyhU6RIl6bCI7YijjHOA5dXLLzqmYUwtTHH1ImVUFw3JHD5wDp44OXT5lGMWSLeSMIhkIDMFwU0Yy9kFNZojZQTcAgBCAA */
  id: 'gateway',
  predictableActionArguments: true,
  tsTypes: {} as import('./useGateway.typegen').Typegen1,
  schema: {
    context: {} as gatewayContext,
    events: {} as | {
      type: 'Edit credentials' | 'Done' | 'Next' | 'Previous' | 'Connect' | 'Refresh devices'
    } | {
      type: 'Update credentials'
      data?: GatewayCredentials
    },
    services: {} as {
      connectToGateway: {
        data: FindGatewayResult
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
              actions: 'updateDevices',
            },

            id: 'fetchDevices',
          },
        },
      },

      initial: 'idle',
      exit: 'updateDevices',
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
    connectToGateway: context => FindGateway(context.credentials.URIs.api, context.credentials.apiKey, context.credentials.id),
    fetchDevices: context => new Promise((resolve, reject) => {
      if (!context.gateway)
        return reject(new Error('No gateway client'))
      context.gateway.getDevices().then((result) => {
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

    updateDevices: assign({
      devices: (context, event) => {
        const devices = context.devices

        const newList = event.type === 'done.invoke.fetchDevices' ? event.data.unwrap() : []
        const oldList = objectKeys(devices)

        if (newList.length > 0 && !context.gateway)
          throw new Error('No gateway client')

        newList
          .filter(uuid => !oldList.includes(uuid))
          .forEach((uuid) => {
            devices[uuid] = spawn(deviceMachine.withContext({
              id: uuid,
              gateway: context.gateway!,
              data: undefined,
            }), uuid)
          })

        oldList
          .filter(uuid => !newList.includes(uuid))
          .forEach((uuid) => {
            devices[uuid].stop?.()
            delete devices[uuid]
          })

        return devices
      },
    }),
  },
  guards: {
    isOk: (context, event) => event.data.isOk()
      && event.data.unwrap().code === 'ok',
    // isErr: (context, event) => event.data.isErr(),
    // TODO, need to handle the bridge_id_mismatch error
    isInvalidAPIKey: (context, event) => event.data.isOk()
      && ['invalid_api_key', 'bridge_id_mismatch'].includes(event.data.unwrap().code),
    isUnreachable: (context, event) => event.data.isErr()
      && event.data.unwrapErr().code === 'unreachable',
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
    id: id.value,
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
