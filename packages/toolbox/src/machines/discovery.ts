import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, spawn } from 'xstate'
import { produce } from 'immer'
import { discoveryMachineWorker } from './discovery-worker'

export interface DiscoveryContext {
  workers: ActorRefFrom<typeof discoveryMachineWorker>[]
}

export const defaultDiscoveryContext: Readonly<DiscoveryContext> = {
  workers: [],
}

export const discoveryMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngHQoQA2YAxAMroCGAdgNoAMAuoqAA6awoAuKTA04gAHogCMAdhYAaEAUTTJRAKwBfDQtQYc+YqQo16zSRyQgefQcNESEktQE4iLAMzOWANgBMahSUEX0l3dS1tEAZMCDhRXSxcQlFrASERSwcAWn9AxCynFnDIhP1CEnIwFN40u0zEX3c8hBVinTREgyIMRgYUBihqm3T7RHdpABYiXwAOSVzFfMlvLXa9JOIehj6BomEqy1TbDNAHCd9fabmFoNbNEo6yzdMdqCIAW0Yg7hrj0YRzjMiM4QjNpAFFsFQsUtEA */
  id: 'discovery',
  predictableActionArguments: true,

  tsTypes: {} as import('./discovery.typegen').Typegen0,

  schema: {
    context: {} as DiscoveryContext,
    events: {} as {
      type: 'Scan'
      uri?: string
    },
  },

  context: structuredClone(defaultDiscoveryContext),

  states: {
    idle: {
      on: {
        Scan: [
          {
            target: 'scanning.one',
            cond: 'hasUri',
          },
          {
            target: 'scanning.many',
          },
        ],
      },
    },
    scanning: {
      states: {
        one: {
          entry: assign({
            workers: (context, { uri }) => produce(context.workers, (draft) => {
              draft.push(
                spawn(discoveryMachineWorker.withContext({
                  uri: uri!,
                }), uri!),
              )
            }),

          }),

          /*
          spawn(discoveryMachineWorker.withContext({
            uri: event.uri!,
          }), 'fo')
          */
        },
        many: {},
      },

      initial: 'one',
    },
  },

  initial: 'idle',
  entry: 'init',
}, {
  actions: {
    init: assign({
      workers: () => {
        return []
      },
    }),
  },
  guards: {
    hasUri: (context, { uri }) => {
      return uri != null
    },
  },
})
