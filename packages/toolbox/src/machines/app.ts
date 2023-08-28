import type { ActorRefFrom } from 'xstate'
import { assign, createMachine, pure, raise, sendTo, spawn, stop } from 'xstate'
import { z } from 'zod'
import { enableMapSet, produce } from 'immer'
import { discoveryMachine } from './discovery'
import { gatewayMachine } from './gateway'

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
    gateways: Map<string, ActorRefFrom<typeof gatewayMachine>>
  }
}

export const appMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqDEBBAIjg+gOJYAqAogOpYCa+AwgEpk5kByJAklgDIDKA2gAYAuolCoA9rACWAF2kSAdmJAAPRAFoAzABYA7ADoATHq2C9ADgsBWQTsEBOAIwAaEAE9EOkwacA2a3sLBystYIsAXwi3NEwAVQAFHFIyIhSqWkZmNk4eAREVSRl5JRV1BG0-JwNBIzMLWqMGpx03TwRrBoMtB0DeyyrGqJj0DCYAWQB5ADVU4nIM+iYWdi4+IVEkECK5BWUt8sqtGqdrJpbGwRstNsRTC18nGxC-KyDI6JBYg1gwWXlFFBYD9kAA3aSAjAQJRgAwQ0ESADWsO+v3+EKBIPBgIQ8IkAGNkCVFBsNoUpLtSgdEBZvAZnA49HVBFonIJrLpbgg-LVuhzXrU-Do-HpvMMvugfn8AZiADYSZAQDFQmFwxQI5EGVHSjHA+WKjG49UEol7UkFLY7YllLzWPwGax6QROBx2Wz+CxGVoeRA8ox8rR+IWO+xGALi7XowHA6QQWVgDDcBUQAAEaJlsDJlop1upCGFDmMOmsjIseguxb0XL8vV8ZkELP8diGn0jGbhcYTvDBYDTOujWfEOb2NoQNnttjsOn0gb8RiMrh93NrTnrjZ5oaMUU+igkEDgKli5OKI7z2n9p2sq+F86s1hLXK094M3gcRhZxecWi0W9bktj8bHpS+ygOUpwGLSOgWAEWh6OWLQ6Iu7Q6K69JzlcTqCAEd7WBGkrprqQG5qBiBOJYvhwRY34uqKV73lyUGFmWxYLg4xYoQ4Wh4agUpRpiAFgERp4kdy5E-lRjj3mRZZIb6DYQYGegck0VFejo3G8e2+pKoCQlUiJ872mRljUYyxaXlyjqGE+ga0uYNZXg4GkEdGWIYnpIFqKRWE6AYcFYT01FnMEllwQGrz2HoDlPNuERAA */
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
    idle: {
      type: 'parallel',
    },

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
          gateways: new Map(),
        }
      },
    }),

    spawnGateway: assign({
      machine: (context, { credentials }) => produce(context.machine, (draft) => {
        const newMachine = spawn(gatewayMachine.withContext({
          ...gatewayMachine.context,
          credentials,
        }), credentials.id)
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
