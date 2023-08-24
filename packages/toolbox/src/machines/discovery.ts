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
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngHQoQA2YAxAMroCGAdgNoAMAuoqAA6awoAuKTA04gAHogC0AJgCcAGhAFEARgDMANgC+Wxagw58xUhRr1mKjkhA8+g4aIkJJa2UVkaWstQHYArIrKCNIaACxEfjp6aFi4hEQYjAwoDFA0XHQA7gwABJmYeADW+KxW3LwCQiLWTn5qoYGqvjq6IAyYEHCi+rFGoraVDjVS0moqjc4qXhFRID2G8SZg-RX21aBOkioAHGoT6tqt83HEiQzJqSt2VY6I0izbRCwqfhrSAUp3kUcxC6fmFygRGEy2sAzWt2CryeLzeHyCKhU0hmPwMJwSAJSQIAtowguVrkMNndthoJiFwt8dEA */

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
