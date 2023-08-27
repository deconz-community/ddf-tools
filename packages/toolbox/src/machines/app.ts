import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, spawn } from 'xstate'
import { z } from 'zod'
import zodEmpty from 'zod-empty'
import { enableMapSet, produce } from 'immer'
import { v4 as uuid } from 'uuid'
import { discoveryMachine } from './discovery'

enableMapSet()

const storageKey = 'app'
const storageSchema = z.object({
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

type SavedContext = z.output<typeof storageSchema>

export type AppContext = SavedContext & {
  machine: {
    discovery: ActorRefFrom<typeof discoveryMachine>
    gateways: Map<string, ActorRefFrom<typeof gatewayMachine>>
  }
}

export const appMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqDEBBAIjg+gOJYAqAogOpYCa+AwgEpk5kByJAklgDIDKA2gAYAuolCoA9rACWAF2kSAdmJAAPRAFoAHAHYAbADpBegEwBWADQgAnpoCMWw2YC+zq2kwBVAAo5SZIn8qWkZmNk4eAREVSRl5JRV1BG0tAE4DLUEAFj1dSxt7dJc3EA8MJgBZAHkANQDicmD6JhZ2Lj4hUSQQWLkFZW6k7VS7DOzcnXzbBDtBMwMTHQBmLKXJ1xLFCQg4FQ8YqT6EwfsTLJMxnLyrae0lg2L3dANpCAAbMAO4-sT7O1SspcJlNELMlhtnEA */
  id: 'app',

  predictableActionArguments: true,
  tsTypes: {} as import('./app.typegen').Typegen0,

  schema: {
    context: zodEmpty(storageSchema) as AppContext,
    events: {} as {
      type: 'ADD_GATEWAY_CREDENTIALS'
      credentials: SavedContext['credentials'][string]
    } | {
      type: 'UPDATE_GATEWAY_CREDENTIALS'
      id: string
      credentials: SavedContext['credentials'][string]
    } | {
      type: 'REMOVE_GATEWAY_CREDENTIALS'
      id: string
    },
  },

  context: {
    credentials: {},
  } as AppContext,

  entry: [
    'init',
    'loadSettings',
    'syncGatewayMachines',
  ],

  on: {
    ADD_GATEWAY_CREDENTIALS: {
      actions: [
        assign({
          credentials: (context, { credentials }) => produce(context.credentials, (draft) => {
            draft[uuid()] = credentials
          }),
        }),
        'syncGatewayMachines',
      ],
    },
    UPDATE_GATEWAY_CREDENTIALS: {
      actions: [
        assign({
          credentials: (context, { id, credentials }) => produce(context.credentials, (draft) => {
            draft[id] = credentials
          }),
        }),
        'syncGatewayMachines',
      ],
    },
    REMOVE_GATEWAY_CREDENTIALS: {
      actions: [
        assign({
          credentials: (context, { id }) => produce(context.credentials, (draft) => {
            delete draft[id]
          }),
        }),
        'syncGatewayMachines',
      ],
    },
  },

  states: {
    idle: {},
  },

  initial: 'idle',
}, {
  actions: {
    init: assign({
      machine: () => {
        return {
          discovery: spawn(discoveryMachine, 'discovery'),
          gateways: new Map(),
        }
      },
    }),

    loadSettings: assign({
      credentials: () => {
        try {
          const saved = localStorage.getItem(storageKey)
          if (!saved)
            return {}
          const parsed = JSON.parse(saved)
          const data = storageSchema.parse(parsed)
          return data.credentials
        }
        catch (e) {
          console.error(e)
          return {}
        }
      },
    }),

    saveSettings: ({ credentials }) => {
      localStorage.setItem(storageKey, JSON.stringify({
        credentials,
      }))
    },

    syncGatewayMachines: assign({
      machine: context => produce(context.machine, (draft) => {
        const currentCredentials = Object.keys(context.credentials)

        for (const id of currentCredentials) {
          if (!draft.gateways.has(id))
            console.log('TODO: spawn gateway machine')
            /*
            const gateway = spawn(gatewayMachine.withContext({
              // TODO Fix this
              // credentials: context.credentials,
            }), context.credentials[id].id)
            draft.gateways.set(id, gateway)
            */
        }

        for (const [id, gateway] of draft.gateways) {
          if (!currentCredentials.includes(id)) {
            gateway.stop?.()
            draft.gateways.delete(id)
          }
        }
      }),
    }),

  },

})