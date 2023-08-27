import { assign, createMachine } from 'xstate'
import type { Gateway, Response } from '@deconz-community/rest-client'

export interface deviceContext {
  id: string
  gateway: ReturnType<typeof Gateway>
  data: Response<'getDevice'>['success']
}

export const deviceMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTANwJYGMwDp0QBswBiAD1gBcBDC3KgM1oCcAKAZgAYuuBKYlDNjyEwAbQ4BdRKAAOAe1joK6OQDtpIUogBMARl05dAVgBs2owBoQAT0S6uAXwdWBWXPTAVMAC3Sqo-Gq4fqhyANa4rkIeXr7+CCFymDQqquIS6RryispqGloIALScOEYA7AAcuuZWtgh6ACw4ZWVsDWxlRk4uaG44MT5+AWBMTHJMODIENPTjALY4Ue6eg-GJyblpkplIINlKqfmIbBUmOACcHZY2Oh2lTs4gqnIo8LtLWQoHebsFhZWlSrVa51fTdEBLYRET45Q6-RD-HAmXRlXQVTq1RDnCr3R6QgZxKAw77qeEIFFNIxsYGY+rVXE9QS4EZjJjEzZHBBGCpNE7aKo1G71NgmB4OIA */
  id: 'device',
  predictableActionArguments: true,

  tsTypes: {} as import('./device.typegen').Typegen0,

  schema: {
    context: {} as deviceContext,
    services: {} as {
      fetchData: {
        data: Response<'getDevice'>
      }
    },
  },

  states: {
    idle: {
      after: {
        300000: 'fetching',
      },
    },

    fetching: {
      invoke: {
        src: 'fetchData',

        onDone: {
          target: 'idle',
          actions: 'saveData',
        },

        onError: 'error',
      },
    },

    error: {},
  },

  initial: 'fetching',
}, {
  services: {
    fetchData: context => context.gateway.getDevice({
      params: {
        deviceUniqueID: context.id,
      },
    }),
  },
  actions: {
    saveData: assign({
      data: (context, event) => event.data.success,
    }),
  },
})
