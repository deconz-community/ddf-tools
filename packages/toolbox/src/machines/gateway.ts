import { assertEvent, assign, enqueueActions, fromCallback, fromPromise, sendTo, setup } from 'xstate'
import type { ActorRef, AnyEventObject } from 'xstate'

import type { EndpointAlias, ExtractParamsForAlias, ExtractResponseSchemaForAlias, FindGatewayResult, GatewayClient, RequestResultForAlias } from '@deconz-community/rest-client'
import { findGateway, websocketSchema } from '@deconz-community/rest-client'

import { produce } from 'immer'
import type { GatewayCredentials } from './app'
// import { deviceMachine } from './device'

export type BundleDescriptor = ExtractResponseSchemaForAlias<'getDDFBundleDescriptors'>['descriptors'][string]

export interface GatewayContext {
  credentials: GatewayCredentials
  gateway?: GatewayClient
  config?: ExtractResponseSchemaForAlias<'getConfig'>
  devices: Map<string, ExtractResponseSchemaForAlias<'getDevice'>>
  // devices: Map<string, ActorRefFrom<typeof deviceMachine>>
  // devices_names: Record<string, string>
  bundles: Map<string, BundleDescriptor>
}

export type AnyGatewayEvent = GatewayEvent |
  WebsocketEvent |
  RefreshEvent |
  RequestEvent<EndpointAlias>

export type GatewayEvent = {
  type: 'CONNECT' | 'DISCONNECT'
} | {
  type: 'UPDATE_CREDENTIALS'
  data: GatewayCredentials
}
/* | {
  type: 'UPDATE_DEVICE_NAME'
  deviceID: string
  name: string
} */

export type WebsocketEvent = {
  type: 'WEBSOCKET_CONNECT'
  uri: string
} | {
  type: 'WEBSOCKET_ERROR'
} | {
  type: 'WEBSOCKET_EVENT'
  data: any
}

export type RefreshEvent = ({
  type: 'REFRESH_CONFIG' | 'REFRESH_DEVICES' | 'REFRESH_BUNDLES'
}) & {
  manual?: boolean
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
  alias: Alias,
  params: ExtractParamsForAlias<Alias>,
  options: RequestEventOptions<Alias> = {},
): AnyGatewayEvent {
  return {
    type: 'REQUEST',
    alias,
    params,
    options,
  } as any
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
    // deviceMachine,

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
              })
            }
            return console.error('Cant parse websocket message', raw, message.error)
          }

          switch (message.data.e) {
            case 'added':
            {
              // TODO: Remplace with the ADD_DEVICE event
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
                  description: description as string,
                })
              }
              break
            }
            case 'deleted':{
              // TODO: Remplace with the REMOVE_DEVICE event
              sendBack({ type: 'REFRESH_DEVICES' })

              break
            }
          }

          /*
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
          */
        })
      })

      return () => scope.stop()
    }),

    // #endregion

    // #region fetchBundles
    fetchBundles: fromPromise<GatewayContext['bundles'], {
      gateway: GatewayClient
      manual?: boolean
    }>(async ({ input }) => {
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

      if (input.manual) {
        toast.info('Bundle list updated', {
          description: `${newList.size} bundles found`,
        })
      }

      return newList
    }),
    // #endregion

    // #region fetchDevices
    fetchDevices: fromPromise<GatewayContext['devices'], {
      gateway: GatewayClient
      manual?: boolean
    }>(async ({ input }) => {
      const { gateway } = input
      const devices = new Map<string, ExtractResponseSchemaForAlias<'getDevice'>>()

      const devicesResults = await gateway.request('getDevices', {})

      for (const result of devicesResults) {
        if (result.isErr())
          throw result.error

        for (const deviceUniqueID of result.value) {
          const deviceData = await gateway.request('getDevice', { deviceUniqueID })

          for (const deviceResult of deviceData) {
            if (deviceResult.isErr())
              continue

            devices.set(deviceUniqueID, deviceResult.value)
          }
        }
      }

      if (input.manual) {
        toast.info('Device list updated', {
          description: `${devices.size} devices found`,
        })
      }

      return devices
    }),
    // #endregion

    // #region doRequest
    doRequest: fromPromise<{
      response: RequestResultForAlias<EndpointAlias>
      previousEvent?: AnyGatewayEvent
    }, {
      gateway: GatewayClient
      request: DoRequestParams<EndpointAlias>
      previousEvent?: AnyGatewayEvent
    }>(async ({ input }) => {
      const { gateway, request } = input
      const response = await gateway.request(request.alias, request.params)
      request.options?.onDone?.(response)
      return {
        response,
        previousEvent: input.previousEvent,
      }
    }),
    // #endregion

  },

  actions: {
    cleanupGatewayData: assign({
      devices: new Map(),
      config: undefined,
      bundles: new Map(),
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
            actions: enqueueActions(({ enqueue, event }) => {
              const result = event.output.unwrap()
              enqueue.assign({
                gateway: result.gateway,
              })
            }),
          },
          {
            target: 'offline.error',
          },
        ],
      },
    },

    online: {
      type: 'parallel',
      entry: ['cleanupGatewayData'],
      exit: ['cleanupGatewayData'],

      on: {
        DISCONNECT: 'offline.disabled',
        REQUEST: {
          actions: enqueueActions(({ enqueue, context, event }) => {
            enqueue.spawnChild('doRequest', {
              input: {
                gateway: context.gateway!,
                request: {
                  alias: event.alias,
                  params: event.params,
                  options: event.options,
                },
              },
            })
          }),
        },
        /*
        UPDATE_DEVICE_NAME: {
          actions: assign({
            devices_names: ({ context, event }) => produce(context.devices_names, (draft) => {
              const { deviceID, name } = event
              draft[deviceID] = name
            }),
          }),
        },
        */
      },

      states: {
        // #region config state
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
                    const response = event.output.response as RequestResultForAlias<'getConfig'>
                    response.forEach((result) => {
                      if (!result.isOk()) {
                        console.error(result.error)
                        return toast.warning('Something went wrong when refreshing config')
                      }

                      const config = result.value

                      // Save new config
                      enqueue.assign({ config })

                      // Update the name of the gateway if it changed
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
        },
        // #endregion

        // #region devices state
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
                input: ({ context, event }) => ({
                  gateway: context.gateway!,
                  manual: event.type === 'REFRESH_DEVICES' ? event.manual : false,
                }),
                onDone: {
                  target: 'idle',
                  actions: enqueueActions(({ enqueue, event }) => {
                    enqueue.assign({ devices: event.output })
                  }),
                },
                onError: {
                  target: 'idle',
                  actions: enqueueActions(({ event }) => {
                    toast.error('Failed to fetch devices')
                    console.error(event)
                  }),
                },
              },
            },
          },

          exit: enqueueActions(({ enqueue /* , context */ }) => {
            /*
            const { devices } = context
            devices.forEach(device => enqueue.stopChild(device))
            */
            enqueue.assign({ devices: new Map() })
          }),

        },
        // #endregion

        // #region websocket state
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
        // #endregion

        // #region bundles state
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
                input: ({ context, event }) => ({
                  gateway: context.gateway!,
                  manual: event.type === 'REFRESH_BUNDLES' ? event.manual : false,
                }),
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
        // #endregion
      },

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
            invalidApiKey: {
              on: {
                REQUEST: {
                  actions: enqueueActions(({ enqueue, context, event }) => {
                    enqueue.spawnChild('doRequest', {
                      input: {
                        gateway: context.gateway!,
                        request: {
                          alias: event.alias,
                          params: event.params,
                          options: event.options,
                        },
                      },
                    })
                  }),
                },
              },
            },
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
