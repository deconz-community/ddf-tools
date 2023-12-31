import { assign, fromPromise, setup } from 'xstate'
import type { Response, WebsocketEvent, gatewayClient } from '@deconz-community/rest-client'
import { produce } from 'immer'
import { objectEntries } from 'ts-extras'

export interface deviceContext {
  deviceID: string
  gatewayClient: ReturnType<typeof gatewayClient>
  data?: Response<'getDevice'>['success']
}

export const deviceMachine = setup({

  types: {
    context: {} as deviceContext,
    input: {} as Pick<deviceContext, 'deviceID' | 'gatewayClient'>,
    events: {} as | {
      type: 'REFRESH'
    } | {
      type: 'WEBSOCKET_EVENT'
      data: WebsocketEvent
    },
  },
  actors: {
    fetchData: fromPromise(({ input }: {
      input: {
        gateway: ReturnType<typeof gatewayClient>
        deviceID: string
      }
    }) => {
      return input.gateway.getDevice({
        params: {
          deviceUniqueID: input.deviceID,
        },
      })
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
          actions: assign({
            data: ({ event }) => event.output.success,
          }),
        },

        onError: 'error',
      },

    },

    error: {},

  },

})
