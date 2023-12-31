import { assign, fromPromise, setup } from 'xstate'
import type { Response, WebsocketEvent, gatewayClient } from '@deconz-community/rest-client'

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
