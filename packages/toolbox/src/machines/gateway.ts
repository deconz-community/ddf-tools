import { assertEvent, assign, enqueueActions, fromCallback, fromPromise, sendTo, setup } from 'xstate'
import type { ActorRef, ActorRefFrom, AnyEventObject } from 'xstate'

import type { FindGatewayResult, GatewayApi, GatewayBodyParams, GatewayClient, GatewayHeaderParams, GatewayQueryParams, GatewayResponse } from '@deconz-community/rest-client'
import { findGateway, websocketSchema } from '@deconz-community/rest-client'

import type { GatewayCredentials } from './app'
import { deviceMachine } from './device'

type BundleDescriptor = Extract<GatewayResponse<'getDDFBundleDescriptors'>['success'], { descriptors: any }>['descriptors'][string]

export interface GatewayContext {
  credentials: GatewayCredentials
  gateway?: GatewayClient
  devices: Map<string, ActorRefFrom<typeof deviceMachine>>
  config: GatewayResponse<'getConfig'>['success']
  bundles: Map<string, BundleDescriptor>
}

export type AnyGatewayEvent = GatewayEvent | WebsocketEvent | RefreshEvent | RequestEvent

export type GatewayEvent = {
  type: 'CONNECT' | 'DISCONNECT'
} | {
  type: 'UPDATE_CREDENTIALS'
  data: GatewayCredentials
}

export type WebsocketEvent = {
  type: 'WEBSOCKET_CONNECT'
  uri: string
} | {
  type: 'WEBSOCKET_ERROR'
} | {
  type: 'WEBSOCKET_EVENT'
  data: any
}

export interface RefreshEvent {
  type: 'REFRESH_CONFIG' | 'REFRESH_DEVICES' | 'REFRESH_BUNDLES'
}

export interface RequestEvent<Alias extends GatewayApi[number]['alias'] = GatewayApi[number]['alias']> {
  type: 'REQUEST'
  alias: Alias
  body: GatewayBodyParams<Alias>
  onDone?: (response: GatewayResponse<Alias>) => void
  onThrow?: (error: unknown) => void
}

export function gatewayRequest<Alias extends GatewayApi[number]['alias'] = GatewayApi[number]['alias']>(
  alias: Alias,
  body: GatewayBodyParams<Alias>,
  params?: {
    onDone?: (response: GatewayResponse<Alias>) => void
    onThrow?: (error: unknown) => void
  },
): RequestEvent<Alias> {
  return {
    type: 'REQUEST',
    alias,
    body,
    onDone: params?.onDone,
    onThrow: params?.onThrow,
  }
}

export const gatewayMachine = setup({
  types: {
    context: {} as GatewayContext,
    events: {} as AnyGatewayEvent,
    input: {} as {
      credentials: GatewayCredentials
    },
  },

  actors: {
    deviceMachine,
    connectToGateway: fromPromise<FindGatewayResult, {
      URIs: string[]
      apiKey: string
      expectedBridgeID: string
    }>(({ input }) => {
      return findGateway(input.URIs, input.apiKey, input.expectedBridgeID)
    }),

    connectToGatewayWebsocket: fromCallback<AnyEventObject, {
      gatewayID: string
      uri: string
      gateway: ActorRef<any, any>
    }>(({ sendBack, input, system }) => {
      const scope = effectScope(true)
      const schema = websocketSchema()

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

          const raw = JSON.parse(data)

          const message = schema.safeParse(raw)

          if (!message.success) {
            if (system.get('app')?.getSnapshot()?.context?.settings?.developerMode) {
              toast.error('Cant parse websocket message', {
                duration: 3000,
                id: '',
                onAutoClose: () => {},
                onDismiss: () => {},
                important: false,
              })
            }
            return console.error('Cant parse websocket message', raw, message.error)
          }

          if (message.data.e === 'added') {
            sendBack({ type: 'REFRESH_DEVICES' })
            const description = message.data.sensor?.name ?? message.data.light?.name ?? 'Unknown device'
            toast.info('Device added', {
              duration: 3000,
              onAutoClose: () => {},
              onDismiss: () => {},
              id: '',
              important: false,
              description: description as string,
            })
          }
          else if (message.data.e === 'deleted') {
            sendBack({ type: 'REFRESH_DEVICES' })
          }

          const { uniqueid } = message.data

          if (!uniqueid)
            return

          const devices = input.gateway.getSnapshot().context.devices as GatewayContext['devices']

          devices.forEach((device) => {
            const { context } = device.getSnapshot()
            if (!uniqueid.startsWith(context.deviceID))
              return

            device.send({ type: 'WEBSOCKET_EVENT', data: message.data })
          })
        })
      })

      return () => scope.stop()
    }),

    fetchConfig: fromPromise<GatewayResponse<'getConfig'>, {
      gateway: GatewayClient
    }>(async ({ input }) => {
      return input.gateway.getConfig()
    }),

    fetchDevices: fromPromise<GatewayResponse<'getDevices'>, {
      gateway: GatewayClient
    }>(async ({ input }) => {
      return input.gateway.getDevices()
    }),

    fetchBundles: fromPromise<GatewayContext['bundles'], { gateway: GatewayClient }>(async ({ input }) => {
      const { gateway } = input
      const newList = new Map<string, BundleDescriptor>()

      let hasMore = true
      let next

      while (hasMore) {
        const result = await gateway.getDDFBundleDescriptors({
          queries: { next },
        })

        const data = result?.success

        if (!data)
          throw new Error('Failed to fetch bundle')

        for (const [key, value] of Object.entries(data.descriptors))
          newList.set(key, value)

        if (data.next) {
          next = data.next
        }
        else {
          next = undefined
          hasMore = false
        }
      }
      return newList
    }),

    doRequest: fromPromise<void, { gateway: GatewayClient, event: RequestEvent }>(async ({ input, self }) => {
      const { gateway, event } = input
      try {
        const result = await gateway[event.alias](event.body)
        event.onDone?.(result)
      }
      catch (e) {
        event.onThrow?.(e)
      }
    }),
  },

}).createMachine({

  id: 'gateway',

  context: ({ input }) => ({
    credentials: input.credentials,
    gateway: undefined,
    devices: new Map(),
    config: undefined,
    bundles: new Map(),
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

      on: {
        DISCONNECT: 'offline.disabled',
        REQUEST: {
          actions: enqueueActions(({ enqueue, context, event }) => {
            if (event.type !== 'REQUEST')
              return
            enqueue.spawnChild('doRequest', {
              input: {
                gateway: context.gateway!,
                event,
              },
            })
          }),
        },
      },

      states: {

        config: {
          initial: 'init',
          states: {
            init: {
              after: {
                50: 'pooling',
              },
            },
            idle: {
              on: {
                REFRESH_CONFIG: 'pooling',
              },
              after: {
                [60 * 1000]: 'pooling',
              },
            },

            pooling: {
              invoke: {
                src: 'fetchConfig',
                input: ({ context }) => ({ gateway: context.gateway! }),
                onDone: {
                  target: 'idle',
                  actions: enqueueActions(({ enqueue, event, context }) => {
                    const config = event.output.success
                    if (!config)
                      return

                    enqueue.assign({
                      config,
                    })

                    if (config.name !== context.credentials.name) {
                      enqueue.raise({ type: 'UPDATE_CREDENTIALS', data: {
                        ...context.credentials,
                        name: config.name,
                      } })
                    }
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

        devices: {
          initial: 'init',

          states: {
            init: {
              after: {
                100: 'pooling',
              },
            },
            idle: {
              on: {
                REFRESH_DEVICES: 'pooling',
              },
              after: {
                [60 * 1000]: 'pooling',
              },
            },

            pooling: {
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
                input: ({ event, context, self }) => {
                  assertEvent(event, 'WEBSOCKET_CONNECT')
                  return {
                    gatewayID: context.credentials.id,
                    gateway: self,
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

        bundles: {
          initial: 'idle',
          states: {
            idle: {
              on: {
                REFRESH_BUNDLES: 'fetching',
              },
            },
            fetching: {
              invoke: {
                input: ({ context }) => ({ gateway: context.gateway! }),
                src: 'fetchBundles',
                onDone: {
                  target: 'idle',
                  actions: [
                    assign({ bundles: ({ event }) => event.output }),
                  ],
                },
                // TODO Display an error message
                onError: 'idle',
              },
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
      on: {
        CONNECT: 'connecting',
      },
      states: {
        disabled: {},
        error: {
          initial: 'unknown',
          on: {
            DISCONNECT: 'disabled',
          },
          states: {
            unreachable: {},
            invalidApiKey: {},
            unknown: {},
          },
        },
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

  },

})
