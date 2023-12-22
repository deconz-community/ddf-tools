import { assign, createMachine, sendParent, spawn } from 'xstate'
import { FindGateway } from '@deconz-community/rest-client'
import type { Gateway, Response } from '@deconz-community/rest-client'
import { Ok } from 'ts-results-es'
import type { GatewayCredentials } from './app'
import { deviceMachine } from './device'
import type { UseAppMachine } from '~/composables/useAppMachine'

export interface gatewayContext {
  credentials: GatewayCredentials
  gateway?: ReturnType<typeof Gateway>
  devices: Record<string, UseAppMachine<'device'>>
  config: Response<'getConfig'>['success']
}

export const gatewayMachine = createMachine({

  id: 'gateway',

  types: {
    context: {} as gatewayContext,
    events: {} as | {
      type: 'EDIT_CREDENTIALS' | 'DONE' | 'NEXT' | 'PREVIOUS' | 'SAVE' | 'CONNECT' | 'REFRESH_DEVICES'
    } | {
      type: 'UPDATE_CREDENTIALS'
      data: GatewayCredentials
    },
    /*
    services: {} as {
      connectToGateway: {
        data: FindGatewayResult
      }
      fetchDevices: {
        data: Result<string[], never>
      }
      createApiKey: {
        data: Result<string, never>
      }
    },
    */
  },

  // TODO use input
  context: ({ input }) => ({
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
    config: undefined,
  }),

  /*
  context: {
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
    config: undefined,
  },
  */

  states: {
    init: {
      after: {
        500: 'connecting',
      },
    },

    connecting: {
      invoke: [{
        src: 'connectToGateway',

        onDone: [{
          target: 'online.poolingDevices',
          guard: 'isOk',
          actions: 'useClient',
        }, {
          target: 'offline.error.unreachable',
          guard: 'isUnreachable',
        }, {
          target: 'offline.error.invalidApiKey',
          guard: 'isInvalidAPIKey',
        }, 'offline.error'],
      }],
    },

    online: {
      states: {
        idle: {
          on: {
            REFRESH_DEVICES: 'poolingDevices',
          },

          after: {
            10000000: 'poolingDevices',
          },
        },

        poolingDevices: {
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
            unreachable: {
              on: {
                EDIT_CREDENTIALS: '#gateway.offline.editing.address',
              },
            },
            invalidApiKey: {
              on: {
                EDIT_CREDENTIALS: '#gateway.offline.editing.apiKey',
              },
            },
            unknown: {
              on: {
                EDIT_CREDENTIALS: '#gateway.offline.editing',
              },
            },
          },

          initial: 'unknown',
        },

        editing: {
          states: {
            apiKey: {
              on: {
                PREVIOUS: 'address',
              },

            },

            address: {
              on: {
                NEXT: 'apiKey',
              },
            },
          },

          initial: 'address',
        },
      },

      initial: 'disabled',

      on: {
        CONNECT: 'connecting',
      },
    },
  },

  initial: 'init',

  on: {
    UPDATE_CREDENTIALS: {
      target: '.init',
      actions: ['updateCredentials', 'saveSettings'],
    },

    EDIT_CREDENTIALS: '.offline.editing',
  },

}).provide({
  actors: {
    connectToGateway: ({ context }) => FindGateway(context.credentials.URIs.api, context.credentials.apiKey, context.credentials.id),
    fetchDevices: ({ context }) => new Promise((resolve, reject) => {
      if (!context.gateway)
        return reject(new Error('No gateway client'))
      context.gateway.getDevices().then((result) => {
        resolve(Ok(result.success!))
      })
    }),

  },
  actions: {
    useClient: assign({
      gateway: ({ context, event }) => event.data.unwrap().gateway,
    }),
    updateCredentials: assign({
      credentials: ({ context, event }) => event.data,
    }),

    saveSettings: sendParent({ type: 'SAVE_SETTINGS' }),

    updateDevices: assign({
      devices: ({ context, event }) => {
        const devices = context.devices

        const newList = event.type === 'done.invoke.fetchDevices' ? event.data.unwrap() : []
        const oldList = objectKeys(devices)

        if (newList.length > 0 && !context.gateway)
          throw new Error('No gateway client')

        newList
          .filter(uuid => !oldList.includes(uuid))
          .forEach((uuid) => {
            devices[uuid] = spawn(deviceMachine, uuid)
            /*
            devices[uuid] = spawn(deviceMachine.withContext({
              id: uuid,
              gateway: context.gateway!,
              data: undefined,
            }), uuid)
            */
          })

        oldList
          .filter(uuid => !newList.includes(uuid))
          .forEach((uuid) => {
            // TODO Fix this
            devices[uuid].stop?.()
            delete devices[uuid]
          })

        return devices
      },
    }),
  },
  guards: {
    isOk: ({ context, event }) => event.data.isOk()
    && event.data.unwrap().code === 'ok',
    // isErr: ({context, event}) => event.data.isErr(),
    // TODO, need to handle the bridge_id_mismatch error
    isInvalidAPIKey: ({ context, event }) => event.data.isOk()
    && ['invalid_api_key', 'bridge_id_mismatch'].includes(event.data.unwrap().code),
    isUnreachable: ({ context, event }) => event.data.isErr()
    && event.data.unwrapErr().code === 'unreachable',
  },
})
