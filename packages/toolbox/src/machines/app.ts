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
  store: z.optional(z.object({
    url: z.string(),
  })),
  settings: z.optional(z.object({
    developerMode: z.boolean().optional(),
  })),
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
  settings: StorageSchema['settings']
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
      type: 'SAVE_SETTINGS' | 'LOAD_SETTINGS'
    } | {
      type: 'UPDATE_SETTINGS'
      settings: Exclude<Partial<AppContext['settings']>, undefined>
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
        input: {
          directusUrl: import.meta.env.VITE_DIRECTUS_URL,
        },
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

        if (data.settings)
          self.send({ type: 'UPDATE_SETTINGS', settings: data.settings })

        if (data.store?.url) {
          system.get('store').send({
            type: 'UPDATE_DIRECTUS_URL',
            directusUrl: data.store.url,
          })
        }
      }
      catch (e) {
        console.error(e)
      }
    },

    saveSettings: ({ system, context }) => {
      const data: StorageSchema = {
        settings: context.settings,
        store: {
          url: system.get('store').getSnapshot()?.context.directusUrl,
        },
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

    UPDATE_SETTINGS: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue.assign({
          settings: ({ context, event }) => produce(context.settings ?? {}, (draft) => {
            Object.entries(event.settings).forEach(([key, value]) => {
              switch (key) {
                case 'developerMode':
                  draft[key] = value
                  break
                default:
                  console.warn(`Unknown setting key: ${key}`)
              }
            })
            return draft
          }),
        })
        enqueue.raise({ type: 'SAVE_SETTINGS' })
      }),
    },
  },

})
