import type { ActorRefFrom, AnyEventObject } from 'xstate'
import { assertEvent, assign, enqueueActions, fromCallback, fromPromise, sendTo, setup } from 'xstate'
import { type Response, findGateway, type gateway } from '@deconz-community/rest-client'
import type { GatewayCredentials } from './app'
import { deviceMachine } from './device'

export interface gatewayContext {
  credentials: GatewayCredentials
  gateway?: ReturnType<typeof gateway>
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
    } | {
      type: 'WEBSOCKET_CONNECT'
      uri: string
    } | {
      type: 'WEBSOCKET_ERROR'
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
      return findGateway(input.URIs, input.apiKey, input.expectedBridgeID)
    }),

    connectToGatewayWebsocket: fromCallback<AnyEventObject, { gatewayID: string, uri: string }>(({ sendBack, input, system }) => {
      const scope = effectScope(true)

      scope.run(() => {
        const { data } = useWebSocket(input.uri, {
          autoReconnect: {
            retries: 3,
            delay: 1000,
            onFailed() {
              sendBack({ type: 'WEBSOCKET_ERROR' })
            },
          },
        })

        watchImmediate(data, (data: unknown) => {
          if (typeof data !== 'string')
            return

          const decoded = JSON.parse(data) as unknown

          if (typeof decoded !== 'object' || decoded === null)
            return console.error('The event is not an object', decoded)

          if ('t' in decoded && decoded.t !== 'event')
            return console.error('Event', decoded)

          console.log(input, decoded)
        })
      })

      return () => scope.stop()
    }),

    fetchDevices: fromPromise(async ({ input }: {
      input: {
        gateway: ReturnType<typeof gateway>
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
            actions: enqueueActions(({ enqueue, event }) => {
              const result = event.output.unwrap()

              if (!event.output.isOk() || result.code !== 'ok')
                throw new Error('Invalid state')

              enqueue.assign({
                gateway: result.gateway,
              })

              enqueue.raise({ type: 'REFRESH_DEVICES' })

              const websocketURI = new URL(result.uri)
              websocketURI.protocol = 'ws:'
              websocketURI.port = (result.config.websocketport).toString()
              enqueue.raise({ type: 'WEBSOCKET_CONNECT', uri: websocketURI.toString() })
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

          initial: 'disabled',
          states: {
            running: {
              invoke: {
                input: ({ event, context }) => {
                  assertEvent(event, 'WEBSOCKET_CONNECT')
                  return {
                    gatewayID: context.credentials.id,
                    uri: event.uri,
                  }
                },
                src: 'connectToGatewayWebsocket',
              },
              on: {
                WEBSOCKET_ERROR: 'error',
              },
            },
            disabled: {
              on: {
                WEBSOCKET_CONNECT: 'running',
              },
            },
            error: {

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

    offline: {
      initial: 'disabled',

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
          initial: 'address',
          states: {
            address: {
              on: {
                NEXT: 'apiKey',
              },
            },
            apiKey: {
              on: {
                PREVIOUS: 'address',
              },
            },
          },
        },
      },

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
