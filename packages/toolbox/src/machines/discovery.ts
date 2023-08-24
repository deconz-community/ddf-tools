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
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngHQoQA2YAxAMroCGAdgNoAMAuoqAA6awoAuKTA04gAHogC0ARgCcAZgA0IAlLmyAvhuWoMOfMVIUa9ZtI5IQPPoOGiJCGQuWrH6rTrRZchIhkYMKAxQNFx0AO4MAAThmHgA1visFty8AkIilg5OSipqspoeIAyYEHCiut4GotbpdllSAEwALNIuUvKdRACsRZX6vkZgNWm2maDZcrmu0vIA7H1eA8T+DIHBIzYZ9mrN3e1u8s2Lej4rputQRMLDlrVjO46ycwcAHIWepwZ+F0FXALaMVypLb1CZSZ4HSTNABsPROVV8q0uREBDEMgX4mzq43EUmasgOrS0WiAA */

  id: 'discovery',
  predictableActionArguments: true,

  tsTypes: {} as import('./discovery.typegen').Typegen0,

  schema: {
    context: {} as DiscoveryContext,
    events: {} as {
      type: 'Scan'
      uri?: string
    } | {
      type: 'Spawn worker'
      uri: string
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
        many: {
          states: {
            init: {},
          },

          initial: 'init',
        },
      },

      initial: 'one',

      on: {
        'Spawn worker': {
          target: 'scanning',
          internal: true,
          actions: 'spawnWorker',
        },
      },
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
    spawnWorker: assign({
      workers: (context, { uri }) => produce(context.workers, (draft) => {
        draft.push(
          spawn(discoveryMachineWorker.withContext({
            uri: uri!,
          }), uri!),
        )
      }),
    }),
  },
  guards: {
    hasUri: (context, { uri }) => {
      return uri != null
    },
  },
})
