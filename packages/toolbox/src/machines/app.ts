import type { ActorRefFrom } from 'xstate'
import { assign, enqueueActions, setup } from 'xstate'
import { z } from 'zod'
import { enableMapSet, produce } from 'immer'
import { discoveryMachine } from './discovery'
import { storeMachine } from './store'
import { gatewayMachine } from './gateway'

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
  discovery: ActorRefFrom<typeof discoveryMachine>
  store: ActorRefFrom<typeof storeMachine>
  gateways: Map<string, ActorRefFrom<typeof gatewayMachine>>
}

export const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as {
      type: 'ADD_GATEWAY'
      credentials: GatewayCredentials
    } | {
      type: 'REMOVE_GATEWAY'
      id: string
    } | {
      type: 'SAVE_SETTINGS'
    } | {
      type: 'LOAD_SETTINGS'
    },
  },

  actions: {
    init: assign({
      discovery: ({ spawn }) => spawn('discoveryMachine', {
        id: 'discovery',
        systemId: 'discovery',
      }),
      store: ({ spawn }) => spawn('storeMachine', {
        id: 'store',
        systemId: 'store',
        input: {},
      }),
      gateways: new Map(),
    }),

    loadSettings: ({ self, system }) => {
      try {
        const saved = localStorage.getItem(storageKey)
        if (!saved)
          return
        const parsed = JSON.parse(saved)
        const data = storageSchema.parse(parsed)

        Object
          .values(data.credentials)
          .forEach((credentials: GatewayCredentials) => self.send({
            type: 'ADD_GATEWAY',
            credentials,
          }))

        if (data.storeUrl) {
          system.get('store').send({
            type: 'UPDATE_DIRECTUS_URL',
            directusUrl: data.storeUrl,
          })
        }
      }
      catch (e) {
        console.error(e)
      }
    },

    saveSettings: ({ system, context }) => {
      const data: StorageSchema = {
        storeUrl: system.get('store').getSnapshot()?.context.directusUrl,
        credentials: {},
      }

      context.gateways.forEach((machine: ActorRefFrom<typeof gatewayMachine>) => {
        const snapshot = machine.getSnapshot()
        if (!snapshot)
          return undefined
        data.credentials[snapshot.context.credentials.id] = snapshot.context.credentials
      })

      localStorage.setItem(storageKey, JSON.stringify(data))
    },

  },

  actors: {
    discoveryMachine,
    storeMachine,
    gatewayMachine,
  },

}).createMachine({

  id: 'app',

  context: {} as AppContext,

  entry: [
    'init',
    'loadSettings',
  ],

  on: {
    LOAD_SETTINGS: {
      actions: {
        type: 'loadSettings',
      },
    },
    SAVE_SETTINGS: {
      actions: {
        type: 'saveSettings',
      },
    },

    ADD_GATEWAY: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue.assign({
          gateways: ({ context, event, spawn }) => produce(context.gateways, (draft) => {
            const { credentials } = event
            draft.set(credentials.id, spawn('gatewayMachine', {
              id: 'gateway',
              systemId: credentials.id,
              input: {
                credentials,
              },
            }))
          }),
        })
        enqueue.raise({ type: 'SAVE_SETTINGS' })
      }),
    },

    REMOVE_GATEWAY: {
      actions: enqueueActions(({ context, event, enqueue }) => {
        const { id } = event
        if (!context.gateways.has(id))
          return

        enqueue.stopChild(context.gateways.get(id)!)
        enqueue.assign({
          gateways: produce(context.gateways, (draft) => {
            draft.delete(id)
          }),
        })
        enqueue.raise({ type: 'SAVE_SETTINGS' })
      }),
    },

  },

})
