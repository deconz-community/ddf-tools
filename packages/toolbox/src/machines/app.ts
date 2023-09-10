import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, pure, raise, sendTo, spawn, stop } from 'xstate'
import { z } from 'zod'
import { enableMapSet, produce } from 'immer'
import { discoveryMachine } from './discovery'
import { gatewayMachine } from './gateway'
import { storeMachine } from './store'

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
  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqDEBBCEAEUyALmAO7ICeA2gAwC6ioqA9rAJZFvMB2jIFiAMwBWYQDoRggGwAOACw0A7FICcwgIwyANCAAeidXKkAmMauMa5gweuHGZKgL6OdaTAFVUEYmAI-y1PR8LOycPHz6CIb2YqIqspqCcioqioo6Agii4orqUoo0FjJSgjRqzq7oGABKYAC2zABuvoQkAbQMSCAhHFy8XZGGwoJiKsaq6uPFxslSGYi56mJykzI0UobqIpoVIG5isGBEnNxQsGJsEAA2YBgAysjNeIfHbKewHcGsveEDiDLCKSxGg0ORgxTSEzGdTzBCqcRbEE0GxSUGFYy7fYvE5nC7XW4AGWYyHw2LeZ0+XR6YX6oEiRhUYhmwlSMlyCjkwnS-EQ8LEiJBKLRxgxLj26AORxx5yuxIg5IwEB4YAu3EazAA1iqsVLyTK5eSEG91QBjYh9DqUpjfGkRRCcoFcmjqFSg4TO2QzWGo0ySKRSTmKBTjYSYiVk94HR4KpXcFXGzXa8O6yOwaOnI1q5hmmmWoJUm19O0IeSmFQuxTGUo2GjDOTewoSYayQoB-JyUVi7jMCBwPhuL6hIt-KKlflpGTWCuc2zCWEicR+4qT4aiEph1CS17vQc-Wl6AyKGTjo9T1Iz0SwuQOMQA6TyFQrWRqUNinXb3GXG6720j-LHwR7FKF91CPXIGxoW9pEUYZ7EnGY5A3LdpTEWUSXJH9hzpRARSBUDTxsc8NEvHksjSJt7wUZQ1BdJCI1xNNGgwgsh1+bConWOQxDSdZBBUKc7AcWEuUUCjZCo+EdmcRwgA */
  id: 'app',

  predictableActionArguments: true,
  tsTypes: {} as import('./app.typegen').Typegen0,

  schema: {
    context: {} as AppContext,
    events: {} as {
      type: 'Add gateway'
      credentials: GatewayCredentials
    } | {
      type: 'Update gateway'
      credentials: GatewayCredentials
    } | {
      type: 'Remove gateway'
      id: string
    } | {
      type: 'Save settings' | 'Load settings'
    },
  },

  context: {} as AppContext,

  on: {
    'Add gateway': {
      actions: [
        'spawnGateway',
        raise('Save settings'),
      ],
    },
    'Update gateway': {
      actions: [
        'updateGatewayCredentials',
        raise('Save settings'),
      ],
    },
    'Remove gateway': {
      actions: [
        'stopGateway',
        raise('Save settings'),
      ],
    },
  },

  states: {
    settings: {
      states: {
        idle: {
          on: {
            'Save settings': 'saving',
            'Load settings': 'loading',
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
}, {
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
      machine: (context, { credentials }) => produce(context.machine, (draft) => {
        const newMachine = spawn(gatewayMachine.withContext(structuredClone({
          ...gatewayMachine.context,
          credentials,
        })), credentials.id)
        draft.gateways.set(credentials.id, newMachine)
      }),
    }),

    updateGatewayCredentials: pure((context, { credentials }) => {
      if (context.machine.gateways.has(credentials.id)) {
        return sendTo(credentials.id, {
          type: 'Update credentials',
          data: credentials,
        })
      }
    }),

    stopGateway: pure((context, { id }) => {
      if (context.machine.gateways.has(id)) {
        return [
          stop(id),
          assign({
            machine: produce(context.machine, (draft) => {
              draft.gateways.delete(id)
            }),
          }),
        ]
      }
    }),
  },
  services: {
    saveSettings: context => async () => {
      const data: StorageSchema = { credentials: {} }

      context.machine.gateways.forEach((machine: ActorRefFrom<typeof gatewayMachine>) => {
        const snapshot = machine.getSnapshot()
        if (!snapshot)
          return undefined
        data.credentials[snapshot.context.credentials.id] = snapshot.context.credentials
      })

      localStorage.setItem(storageKey, JSON.stringify(data))
    },

    loadSettings: () => async (callback) => {
      try {
        const saved = localStorage.getItem(storageKey)
        if (!saved)
          return
        const parsed = JSON.parse(saved)
        const data = storageSchema.parse(parsed)
        Object.values(data.credentials).forEach((credentials: GatewayCredentials) => callback({
          type: 'Add gateway',
          credentials,
        }))
      }
      catch (e) {
        console.error(e)
      }
    },
  },

})
