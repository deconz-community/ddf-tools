import type { ActorRefFrom } from 'xstate'
import { assign, enqueueActions, fromPromise, sendTo, setup } from 'xstate'
import { FindGateway, type Gateway, type Response } from '@deconz-community/rest-client'
import type { GatewayCredentials } from './app'
import { deviceMachine } from './device'

export interface gatewayContext {
  credentials: GatewayCredentials
  gateway?: ReturnType<typeof Gateway>
  devices: Map<string, ActorRefFrom<typeof deviceMachine>>
  config: Response<'getConfig'>['success']
}

export const gatewayMachine = setup({

  types: {
    context: {} as gatewayContext,
    events: {} as | {
      type: 'EDIT_CREDENTIALS'
    } | {
      type: 'DONE'
    } | {
      type: 'NEXT'
    } | {
      type: 'PREVIOUS'
    } | {
      type: 'SAVE'
    } | {
      type: 'CONNECT'
    } | {
      type: 'REFRESH_DEVICES'
    } | {
      type: 'UPDATE_CREDENTIALS'
      data: GatewayCredentials
    },
    input: {} as {
      credentials: GatewayCredentials
    },

  },

  actors: {
    deviceMachine,
    connectToGateway: fromPromise(({ input }: {
      input: {
        URIs: string[]
        apiKey: string
        expectedBridgeID: string
      }
    }) => {
      return FindGateway(input.URIs, input.apiKey, input.expectedBridgeID)
    }),
    fetchDevices: fromPromise(async ({ input }: {
      input: {
        gateway: ReturnType<typeof Gateway>
      }
    }) => {
      return input.gateway.getDevices()
    }),
  },

}).createMachine({

  id: 'gateway',

  context: ({ input }) => ({
    credentials: input.credentials,
    gateway: undefined,
    devices: new Map(),
    config: undefined,
  }),

  initial: 'init',

  states: {

    init: {
      after: {
        500: 'connecting',
      },
    },

    connecting: {
      invoke: {
        src: 'connectToGateway',
        input: ({ context }) => ({
          URIs: context.credentials.URIs.api,
          apiKey: context.credentials.apiKey,
          expectedBridgeID: context.credentials.id,
        }),
        onDone: [
          {
            target: 'online',
            guard: ({ event }) => event.output.isOk() && event.output.unwrap().code === 'ok',
            actions: enqueueActions(({ enqueue }) => {
              enqueue.assign({
                gateway: ({ event }) => event.output.unwrap().gateway,
              })
              enqueue.raise({ type: 'REFRESH_DEVICES' })
            }),
          },
          {
            target: 'offline.error.unreachable',
            guard: ({ event }) => event.output.isErr() && event.output.unwrapErr().code === 'unreachable',
          },
          {
            target: 'offline.error.invalidApiKey',
            guard: ({ event }) => event.output.isOk() && ['invalid_api_key', 'bridge_id_mismatch'].includes(event.output.unwrap().code),
          },
          {
            target: 'offline.error',
          },
        ],
      },
    },

    online: {

      type: 'parallel',

      states: {
        api: {

          initial: 'idle',

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
                input: ({ context }) => ({ gateway: context.gateway! }),
                onDone: {
                  target: 'idle',

                  actions: enqueueActions(({ enqueue, context, event }) => {
                    const { devices } = context

                    const newList = event.output.success ?? []
                    const oldList = Array.from(devices.keys())

                    const addedUUIDs = newList.filter(uuid => !oldList.includes(uuid))
                    const removedUUIDs = oldList.filter(uuid => !newList.includes(uuid))

                    removedUUIDs.forEach((uuid) => {
                      enqueue.stopChild(devices.get(uuid)!)
                      devices.delete(uuid)
                    })

                    enqueue.assign({
                      devices: ({ context, spawn }) => {
                        addedUUIDs.forEach((uuid) => {
                          devices.set(uuid, spawn('deviceMachine', {
                            id: 'device',
                            systemId: `${context.credentials.id}-${uuid}`,
                            input: {
                              deviceID: uuid,
                              gatewayClient: context.gateway!,
                            },
                          }))
                        })
                        return devices
                      },
                    })
                  }),

                },
              },
            },
          },

          exit: enqueueActions(({ enqueue, context }) => {
            const { devices } = context
            devices.forEach(device => enqueue.stopChild(device))
            enqueue.assign({ devices: new Map() })
          }),

        },
        websocket: {

        },
      },

      exit: enqueueActions(({ enqueue, context }) => {
        const { devices } = context
        devices.forEach(device => enqueue.stopChild(device))
        enqueue.assign({ devices: new Map() })
      }),

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

  on: {
    UPDATE_CREDENTIALS: {
      target: '.init',
      actions: [
        assign({ credentials: ({ event }) => event.data }),
        sendTo(({ system }) => system.get('app'), { type: 'SAVE_SETTINGS' }),
      ],
    },

    EDIT_CREDENTIALS: '.offline.editing',

  },

})
