import { assertEvent, assign, enqueueActions, fromCallback, fromPromise, sendTo, setup } from 'xstate'
import type { ActorRef, ActorRefFrom, AnyEventObject } from 'xstate'

import type { EndpointAlias, ExtractParamsForAlias, ExtractResponseSchemaForAlias, FindGatewayResult, GatewayClient, RequestResultForAlias } from '@deconz-community/rest-client'
import { findGateway, websocketSchema } from '@deconz-community/rest-client'

import type { GatewayCredentials } from './app'
import { deviceMachine } from './device'

export type BundleDescriptor = ExtractResponseSchemaForAlias<'getDDFBundleDescriptors'>['descriptors'][string]

export interface GatewayContext {
  credentials: GatewayCredentials
  gateway?: GatewayClient
  devices: Map<string, ActorRefFrom<typeof deviceMachine>>
  config?: ExtractResponseSchemaForAlias<'getConfig'>
  bundles: Map<string, BundleDescriptor>
}

export type AnyGatewayEvent = GatewayEvent | WebsocketEvent | RefreshEvent | RequestEvent<EndpointAlias>

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

export interface RequestEventOptions<Alias extends EndpointAlias> {
  onDone?: (responses: RequestResultForAlias<Alias>) => void
}

export interface DoRequestParams<Alias extends EndpointAlias> {
  alias: Alias
  params: ExtractParamsForAlias<Alias>
  options?: RequestEventOptions<Alias>
}

export type RequestEvent<Alias extends EndpointAlias> = {
  type: 'REQUEST'
} & DoRequestParams<Alias>

export function gatewayRequest<Alias extends EndpointAlias>(
  request: DoRequestParams<Alias>,
): RequestEvent<Alias> {
  return {
    type: 'REQUEST',
    ...request,
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

    // #region connectToGatewayWebsocket
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

          switch (message.data.e) {
            case 'added':
            {
              sendBack({ type: 'REFRESH_DEVICES' })

              let description: string | undefined
              switch (message.data.r) {
                case 'sensors':
                  description = message.data.sensor.name
                  break
                case 'lights':
                  description = message.data.light.name
              }

              if (description) {
                toast.info('Device added', {
                  duration: 3000,
                  onAutoClose: () => {},
                  onDismiss: () => {},
                  id: '',
                  important: false,
                  description: description as string,
                })
              }
              break
            }
            case 'deleted':{
              sendBack({ type: 'REFRESH_DEVICES' })

              break
            }
          }

          if ('uniqueid' in message.data) {
            const { uniqueid } = message.data

            const devices = input.gateway.getSnapshot().context.devices as GatewayContext['devices']
            devices.forEach((device) => {
              const { context } = device.getSnapshot()
              if (!uniqueid.startsWith(context.deviceID))
                return

              device.send({ type: 'WEBSOCKET_EVENT', data: message.data })
            })
          }
        })
      })

      return () => scope.stop()
    }),

    // #endregion

    fetchBundles: fromPromise<GatewayContext['bundles'], { gateway: GatewayClient }>(async ({ input }) => {
      const { gateway } = input
      const newList = new Map<string, BundleDescriptor>()

      let hasMore = true
      let next: string | number | undefined

      while (hasMore) {
        const results = await gateway.request('getDDFBundleDescriptors', { next })

        results.forEach((result) => {
          // console.log(result)
          if (result.isErr())
            throw new Error('Failed to fetch bundle')

          for (const [key, value] of Object.entries(result.value.descriptors))
            newList.set(key, value)

          if (result.value.next) {
            next = result.value.next
          }
          else {
            next = undefined
            hasMore = false
          }
        })
      }
      return newList
    }),

    doRequest: fromPromise<RequestResultForAlias<EndpointAlias>, { gateway: GatewayClient, request: DoRequestParams<EndpointAlias> }>(async ({ input }) => {
      const { gateway, request } = input
      const result = await gateway.request(request.alias, request.params)
      request.options?.onDone?.(result)
      return result
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

              if (!event.output.isOk() || result.code !== 'ok' || result.config.authenticated === false)
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

            const params = {
              gateway: context.gateway!,
              ...event,
            } as any

            enqueue.spawnChild('doRequest', {
              input: params,
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
                src: 'doRequest',
                input: ({ context }) => ({
                  gateway: context.gateway!,
                  request: {
                    alias: 'getConfig',
                    params: {},
                  },
                }),
                onDone: {
                  target: 'idle',
                  actions: enqueueActions(({ enqueue, event, context }) => {
                    const output = event.output as RequestResultForAlias<'getConfig'>

                    output.forEach((result) => {
                      // event.output.forEach((result) => {
                      if (!result.isOk())
                        return console.warn('Something went wrong when refreshing config', result.error)

                      const config = result.value

                      enqueue.assign({
                        config,
                      })

                      if (config.name !== context.credentials.name) {
                        enqueue.raise({
                          type: 'UPDATE_CREDENTIALS',
                          data: {
                            ...context.credentials,
                            name: config.name,
                          },
                        })
                      }
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
                src: 'doRequest',
                input: ({ context }) => ({
                  gateway: context.gateway!,
                  request: {
                    alias: 'getDevices',
                    params: {},
                  },
                }),
                onDone: {
                  target: 'idle',

                  actions: enqueueActions(({ enqueue, event, context }) => {
                    const output = event.output as RequestResultForAlias<'getDevices'>
                    const { devices } = context

                    const newList: string[] = []

                    output.forEach((result) => {
                      if (!result.isOk())
                        return console.warn('Something went wrong when refreshing devices', result.error)

                      newList.push(...result.value)
                    })

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
