import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, enqueueActions, fromCallback, fromPromise, raise, sendTo, spawn, stop } from 'xstate'
import { z } from 'zod'
import { enableMapSet, produce } from 'immer'
import { discoveryMachine } from './discovery'
import { gatewayMachine } from './gateway'
import { storeMachine } from './store'

enableMapSet()

// https://stately.ai/docs/migration#use-params-to-pass-params-to-actions--guards

const storageKey = 'app'
const storageSchema = z.object({
  storeUrl: z.optional(z.string()),
  credentials: z.record(z.object({
    id: z.string(),
    name: z.string(),
    apiKey: z.string(),
    URIs: z.object({
      api: z.array(z.string()),
      websocket: z.array(z.string()),
    }),
  })),
})
export type StorageSchema = z.output<typeof storageSchema>

export type GatewayCredentials = StorageSchema['credentials'][string]

export interface AppContext {
  machine: {
    discovery: ActorRefFrom<typeof discoveryMachine>
    store: ActorRefFrom<typeof storeMachine>
    gateways: Map<string, ActorRefFrom<typeof gatewayMachine>>
  }
}

export const appMachine = createMachine({

  id: 'app',

  types: {
    context: {} as AppContext,
    events: {} as {
      type: 'ADD_GATEWAY'
      credentials: GatewayCredentials
    } | {
      type: 'UPDATE_GATEWAY'
      credentials: GatewayCredentials
    } | {
      type: 'REMOVE_GATEWAY'
      id: string
    } | {
      type: 'SAVE_SETTINGS' | 'LOAD_SETTINGS'
    },
  },

  context: {} as AppContext,

  on: {
    ADD_GATEWAY: {
      actions: [
        'spawnGateway',
        raise({ type: 'SAVE_SETTINGS' }),
      ],
    },
    UPDATE_GATEWAY: {
      actions: [
        'updateGatewayCredentials',
        raise({ type: 'SAVE_SETTINGS' }),
      ],
    },
    REMOVE_GATEWAY: {
      actions: [
        'stopGateway',
        raise({ type: 'SAVE_SETTINGS' }),
      ],
    },
  },

  states: {
    settings: {
      states: {
        idle: {
          on: {
            SAVE_SETTINGS: 'saving',
            LOAD_SETTINGS: 'loading',
          },
        },
        loading: {
          invoke: {
            src: 'loadSettings',
            onDone: 'idle',
          },
        },
        saving: {
          invoke: {
            src: 'saveSettings',
            onDone: 'idle',
          },
        },
      },

      initial: 'loading',
    },
  },

  entry: 'init',
  type: 'parallel',
}).provide({
  actions: {
    init: assign({
      machine: () => {
        return {
          discovery: spawn(discoveryMachine, 'discovery'),
          store: spawn(storeMachine, 'store'),
          gateways: new Map(),
        }
      },
    }),

    spawnGateway: assign({
      machine: ({ context, event }) => produce(context.machine, (draft) => {
        const { credentials } = event
        const newMachine = spawn(gatewayMachine, credentials.id)
        /*
        const newMachine = spawn(gatewayMachine.withContext(structuredClone({
          ...gatewayMachine.context,
          credentials,
        })), credentials.id)
        */
        draft.gateways.set(credentials.id, newMachine)
      }),
    }),

    updateGatewayCredentials: enqueueActions(({ context, event, enqueue }) => {
      const { credentials } = event

      if (context.machine.gateways.has(credentials.id)) {
        enqueue(sendTo(credentials.id, {
          type: 'UPDATE_CREDENTIALS',
          data: credentials,
        }))
      }
    }),

    stopGateway: enqueueActions(({ context, event, enqueue }) => {
      const { id } = event
      if (context.machine.gateways.has(id)) {
        enqueue(stop(id))
        enqueue(assign({
          machine: produce(context.machine, (draft) => {
            draft.gateways.delete(id)
          }),
        }))
      }
    }),
  },
  actors: {
    saveSettings: fromPromise(async ({ context }) => {
      const data: StorageSchema = {
        storeUrl: context.machine.store.getSnapshot()?.context.directusUrl,
        credentials: {},
      }

      context.machine.gateways.forEach((machine: ActorRefFrom<typeof gatewayMachine>) => {
        const snapshot = machine.getSnapshot()
        if (!snapshot)
          return undefined
        data.credentials[snapshot.context.credentials.id] = snapshot.context.credentials
      })

      localStorage.setItem(storageKey, JSON.stringify(data))
    }),

    loadSettings: fromCallback(({ sendBack, receive, input, context }) => {
      try {
        const saved = localStorage.getItem(storageKey)
        if (!saved)
          return
        const parsed = JSON.parse(saved)
        const data = storageSchema.parse(parsed)
        Object.values(data.credentials).forEach((credentials: GatewayCredentials) => sendBack({
          type: 'ADD_GATEWAY',
          credentials,
        }))

        if (data.storeUrl) {
          context.machine.store.send({
            type: 'UPDATE_DIRECTUS_URL',
            directusUrl: data.storeUrl,
          })
        }
      }
      catch (e) {
        console.error(e)
      }
    }),

  },

})
