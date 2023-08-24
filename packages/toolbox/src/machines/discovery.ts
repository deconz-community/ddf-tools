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
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngHQoQA2YAxAMroCGAdgNoAMAuoqAA6awoAuKTA04gAHogCMAJgAsRAJwBWAMwylAGhAFE0lksUKjC2bKUsA7LIAckpQF97W1Bhz5ipCjXrNJHJCA8fILCohIIkpIqhtKS1hbmLElJKlo6CCos8kl6krIKWbIyFgBsjs5oWLiERBiMDCgMUDRcdADuDAAEbZh4ANb4rP7cvAJCIgHhJSySRNbWJQtyagrW0iVpUtYGsgkWckpmsdKqjk4gDJgQcKIuVe6iQWOhk4gAtPGKFpIl+6ayLGktgsmwQbxUFiI0gUFm+0MOFniu3KIDubhqnjAj1GIQmoHC4IUXx+f1MgOBoL0BmMRlM5istgc5zR1WIdQYDSa2OC4zCiEyJSIFhYvwUKhKZii81BMKhgKBwqO6hUKJZ7lqPk5UCIwixASeuL5GUOQpFFjFEqUUusoLi8mF0gVWSUx1OzMq6LZmsa2oAtox0iMeS98fyrEQSgpIkoTApIwlNNp+fpTbJMnplgmzvYgA */
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
        many: {},
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
