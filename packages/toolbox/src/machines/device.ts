import { assign, createMachine, fromPromise } from 'xstate'
import type { Gateway, Response } from '@deconz-community/rest-client'

export interface deviceContext {
  id: string
  gateway: ReturnType<typeof Gateway>
  data: Response<'getDevice'>['success']
}

export const deviceMachine = createMachine({
  id: 'device',

  // TODO use input
  context: ({ input }) => (input),

  initial: 'fetching',
  states: {
    idle: {
      after: {
        300000: 'fetching',
      },
    },

    fetching: {
      invoke: {
        src: 'fetchData',
        input: ({ context }) => ({
          gateway: context.gateway,
          id: context.id,
        }),

        onDone: {
          target: 'idle',
          actions: 'saveData',
        },

        onError: 'error',
      },
    },

    error: {},
  },

}).provide({
  actors: {
    fetchData: fromPromise(({ input }) => {
      // console.log('fetchData', typeof context.gateway.getDevice)
      // console.log('fetchData', context.gateway.getDevice)

      return input.gateway.getDevice({
        params: {
          deviceUniqueID: input.id,
        },
      })
    }),
  },
  actions: {
    saveData: assign({
      data: ({ event }) => event.data.success,
    }),
  },
})
