import type { ActorRefFrom } from 'xstate'
import { assign, setup } from 'xstate'
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
      type: 'UPDATE_GATEWAY'
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
        systemId: 'discovery',
      }),
      store: ({ spawn }) => spawn('storeMachine', {
        systemId: 'store',
      }),
      gateways: new Map(),
    }),

    loadSettings: ({ self }) => {
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
          /*
          context.machine.store.send({
            type: 'UPDATE_DIRECTUS_URL',
            directusUrl: data.storeUrl,
          })
          */
        }
      }
      catch (e) {
        console.error(e)
      }
    },

    saveSettings: () => {

    },

    spawnGateway: assign({
      gateways: ({ context, event, spawn }) => produce(context.gateways, (draft) => {
        if (event.type !== 'ADD_GATEWAY')
          return

        const { credentials } = event

        draft.set(credentials.id, spawn('gatewayMachine', {
          id: `gateway-${credentials.id}`,
          systemId: `gateway-${credentials.id}`,
          input: {
            credentials,
          },
        }))
      }),
    }),

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
      actions: 'spawnGateway',
    },

    /*
    ADD_GATEWAY: {
      target: '#app',
      actions: [
        'spawnGateway',
      ],
    },
    */
    /*
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
    */
  },

}).provide({
  actions: {

    /*
    spawnGateway: assign({
      machine: ({ context, event }) => produce(context.machine, (draft) => {
        const { credentials } = event
        const newMachine = createActor(gatewayMachine, {
          systemId: credentials.id,
        })

        //const newMachine = spawn(gatewayMachine.withContext(structuredClone({
        //  ...gatewayMachine.context,
        //  credentials,
        //})), credentials.id)

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
        enqueue(stopChild(id))
        enqueue(assign({
          machine: produce(context.machine, (draft) => {
            draft.gateways.delete(id)
          }),
        }))
      }
    }),
    */
  },
  actors: {
    /*
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

    */

  },

})
