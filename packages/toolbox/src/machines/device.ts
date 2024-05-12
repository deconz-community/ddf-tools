import type { ActorRefFrom } from 'xstate'
import { assign, enqueueActions, fromPromise, setup } from 'xstate'
import type { ExtractResponseSchemaForAlias, WebsocketEvent, gatewayClient } from '@deconz-community/rest-client'
import { produce } from 'immer'
import { objectEntries } from 'ts-extras'
import type { gatewayMachine } from './gateway'

export interface deviceContext {
  deviceID: string
  gatewayID: string
  gatewayClient: ReturnType<typeof gatewayClient>
  data?: ExtractResponseSchemaForAlias<'getDevice'>
}

export const deviceMachine = setup({

  types: {
    context: {} as deviceContext,
    input: {} as Pick<deviceContext, 'deviceID' | 'gatewayID' | 'gatewayClient'>,
    events: {} as | {
      type: 'REFRESH'
    } | {
      type: 'WEBSOCKET_EVENT'
      data: WebsocketEvent
    },
  },
  actors: {
    fetchData: fromPromise(async ({ input }: {
      input: {
        gateway: ReturnType<typeof gatewayClient>
        deviceID: string
      }
    }) => {
      const data = await input.gateway.request('getDevice', {
        deviceUniqueID: input.deviceID,
      })

      return data
    }),

  },
}).createMachine({
  id: 'device',

  context: ({ input }) => ({
    ...input,
    data: undefined,
  }),

  initial: 'fetching',
  states: {
    idle: {
      on: {
        REFRESH: 'fetching',
        WEBSOCKET_EVENT: {
          actions: assign({
            data: ({ context, event }) => produce(context.data, (draft) => {
              if (!draft || event.data.e !== 'changed')
                return

              // TODO: Fix theses errors
              const { state, config, attr } = event.data

              if (state === undefined && config === undefined && attr === undefined)
                return

              if (attr) {
                objectEntries(attr).forEach(([key, value]) => {
                  if (key === 'uniqueid')
                    return

                  if (draft[key])
                    draft[key] = value
                })
              }

              draft.subdevices?.forEach((subdevice) => {
                if (subdevice.uniqueid !== event.data.uniqueid)
                  return

                if (state) {
                  objectEntries(state).forEach(([key, value]) => {
                    if (subdevice?.state?.[key]) {
                      subdevice.state[key].value = value
                      if (state.lastupdated)
                        subdevice.state[key].lastupdated = state.lastupdated as any
                    }
                  })
                }
                if (config) {
                  objectEntries(config).forEach(([key, value]) => {
                    if (subdevice?.config?.[key]) {
                      subdevice.config[key].value = value
                      if (state?.lastupdated)
                        subdevice.config[key].lastupdated = state.lastupdated as any
                    }
                  })
                }
              })
            }),
          }),
        },
      },
      after: {
        300000: 'fetching',
      },
    },

    fetching: {
      invoke: {
        input: ({ context }) => ({
          gateway: context.gatewayClient,
          deviceID: context.deviceID,
        }),
        src: 'fetchData',
        onDone: {
          target: 'idle',
          actions: enqueueActions(({ event, context, system, enqueue }) => {
            const data = event.output.reduce<ExtractResponseSchemaForAlias<'getDevice'> | undefined>(
              (data, result) => result.isOk() ? result.value : data,
              undefined,
            )
            enqueue.assign({ data })
            enqueue.sendTo<ActorRefFrom<typeof gatewayMachine>>(system.get(context.gatewayID), {
              type: 'UPDATE_DEVICE_NAME',
              deviceID: context.deviceID,
              name: data?.name ?? `Unknown device (${context.deviceID})`,
            })
          }),
        },

        onError: 'error',
      },

    },

    error: {},

  },

})
