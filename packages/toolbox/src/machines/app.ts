import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, spawn } from 'xstate'
import { discoveryMachine } from './discovery'
import type { GatewayCredentials } from '~/interfaces/deconz'

export interface AppContext {
  credentials: Record<string, GatewayCredentials>
  machine: {
    discovery: ActorRefFrom<typeof discoveryMachine>
    gateways: Record<string, ActorRefFrom<typeof discoveryMachine>>
  }
}

export const appMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgEMAHI-EIrWASwBcqsMyAPRAWgEYB2ATgDoAOAAwAWAGz9OAVnQBPNu0EBmXpORrkQA */
  id: 'app',

  tsTypes: {} as import('./app.typegen').Typegen0,

  schema: {
    context: {} as AppContext,
  },

  context: {
    credentials: {},
  } as AppContext,

  entry: 'init',

}, {
  actions: {
    init: assign({
      machine: () => {
        return {
          discovery: spawn(discoveryMachine, 'discovery'),
          gateways: {},
        }
      },
    }),
  },

})
