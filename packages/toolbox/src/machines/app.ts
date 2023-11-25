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
  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqDEBBAIjg+gOJYAqAogOpYCaA2gAwC6ioqA9rAJYAunbAdixAAPRAEZ6ADgB0AVgCcAZlmL5AJgDskgCyT52xQBoQAT0QBaNWun1Zk+gDY1DhwoNiNAX0-G0mAKoACjikZEShVHRMQuxcvAJCogjamnKSGo708lm2atoaxmYI5hLSYvYO2gb0GsqSilrevugYAEpkALIA8gBqYcTkkQzMSCCxPHyCo0ka8hrSuor22jWVNfKFFmoyOrJidulSuhpePiB+0rBg3Lz8ULDSnBAANmAYAMpYffjvZCQkAEkAHKEd7DGIcCYJaaIBySazKDQqOaybTqMTaTbJFLSSR2eiaBr0HKKJrndCXa63e6PF5vAAyXVwPz+gJBYOio3G8SmoCSan00gae3kDn2GjEcI2pkQBm0Qo02nFYjEqjs2jJFyuN04dwezzYyAguqgGAgAjAj34ADc2ABrS1aqkm-WG413BC620AY2QPOG4K5kJ5iUQAsU0gcs0kkn2ijyiiWWJU8t0mgJsjyc0cmop2upD1gyGtJrNFqttod0idOr1l2LJs9NrYvv9TEDrGDk1DCDh9BsAqVStVijE0qKKYW8Il8P2Yvh3jO-DYEDgQj8ELi3ZhxXj0gleSRGjUBPhegcWLUYgRiv28hVs1qp2aqEptfum6hvJE4lk0m2SJ5JocweBImIyggijaA4uK3q4VQnBKSi5q++YurSryfiGO57H+Bj2MSDhQbkBQQSo1iirIszXqozh4ihb4FtIBpGiaWHbnysIRgBmYpI+oH0OBE5ZFOmhWASWiigxaF1kWJZ3Ox0KcQg2RiLi9iJoJqqzFUyYiWmx4npoegKIunhAA */
  id: 'app',

  predictableActionArguments: true,
  tsTypes: {} as import('./app.typegen').Typegen0,

  schema: {
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
        // eslint-disable-next-line xstate/no-inline-implementation
        raise('SAVE_SETTINGS'),
      ],
    },
    UPDATE_GATEWAY: {
      actions: [
        'updateGatewayCredentials',
        // eslint-disable-next-line xstate/no-inline-implementation
        raise('SAVE_SETTINGS'),
      ],
    },
    REMOVE_GATEWAY: {
      actions: [
        'stopGateway',
        // eslint-disable-next-line xstate/no-inline-implementation
        raise('SAVE_SETTINGS'),
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
          type: 'UPDATE_CREDENTIALS',
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
    },

    loadSettings: context => async (callback) => {
      try {
        const saved = localStorage.getItem(storageKey)
        if (!saved)
          return
        const parsed = JSON.parse(saved)
        const data = storageSchema.parse(parsed)
        Object.values(data.credentials).forEach((credentials: GatewayCredentials) => callback({
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
    },
  },

})
