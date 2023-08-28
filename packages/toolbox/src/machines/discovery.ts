import { Discovery, Gateway } from '@deconz-community/rest-client'
import { produce } from 'immer'
import { assign, createMachine } from 'xstate'

export interface DiscoveryResult {
  id: string
  name: string
  version: string
  uri: string[]
}

export interface DiscoveryContext {
  results: Map<string, DiscoveryResult>
}

export const discoveryMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngHQoQA2YAxAMoAuAhnrQAQb0B2A2gAwC6ioAA6ZYKWikzsBIAB6IAtADYArIqIAOAOzKALOvUBmAJybFARkMAaEAUSaDRAEz2dOzZp0Gdu5WYC+ftaoGDj4xGzs7CjsUJQQkmAk7NiYANaJwVi4hEQRUTEI0Sno9OKSPLwV0sKiZVJIsgqKOmZERopGjq7t6r4W1rYI8g7cZprq3DodOqOKio6OAUFoWWG5JZHRsXSYgqwbVQ01YhL1oHJDzdxO9kbcRp6q3AYDiGZGDmbGytyTY9yKAzqIxLECZUI5PJbSgAMUwAFd2BBmFBSmAAO70AiHIQiE6SaQXeRjHREbiORT2ey6IzKXrqV4Iew3LxuDxeHwGAKBEDsTAQODScHZQa42qnQkKYFGMlTLTKRnyO5EXzuLSOEmaWn+HnCtakCjVPF1SVDXqtSaKeWM9qgvWQjb5KBG8UEhpEzzXVSKbhaQEGK3GRnKGU-X6jZTuZ7AxTcvxAA */

  id: 'discovery',

  predictableActionArguments: true,
  tsTypes: {} as import('./discovery.typegen').Typegen0,

  schema: {
    context: {} as DiscoveryContext,
    events: {} as {
      type: 'Start scan'
      uri?: string | string[]
    } | {
      type: 'Stop scan'
    } | {
      type: 'Found gateway'
      uri: string
      id: string
      name: string
      version: string
    },
  },

  context: (): DiscoveryContext => ({
    results: new Map(),
  }),

  states: {
    idle: {
      on: {
        'Start scan': {
          target: 'scanning',
          actions: 'cleanupResults',
        },
      },
    },

    scanning: {
      invoke: {
        src: 'scan',
        onDone: 'idle',
      },

      on: {
        'Stop scan': 'idle',

        'Found gateway': {
          target: 'scanning',
          internal: true,
          actions: 'saveGatewayResult',
        },
      },

      entry: 'cleanupResults',
    },
  },

  initial: 'idle',

}, {
  actions: {
    cleanupResults: assign({
      results: context => produce(context.results, (draft) => {
        draft.clear()
      }),
    }),

    saveGatewayResult: assign({
      results: (context, { id, name, version, uri }) => produce(context.results, (draft) => {
        if (draft.has(id)) {
          const result = draft.get(id)!
          result.name = name
          result.uri.push(uri)
        }
        else {
          draft.set(id, { id, name, version, uri: [uri] })
        }
      }),
    }),

    /*
    setEditing: assign({
      editing: (context, event) => 'id' in event ? context.results.get(event.id) : undefined,
    }),

    updateURI: assign({
      editing: (context, event) => produce(context.editing, (draft) => {
        if (!draft)
          throw new Error('Error while editing, no editing context')
        draft.uri = event.data
      }),
    }),
    */
  },
  services: {
    scan: (context, event) => async (callback) => {
      const guesses = [
        'http://localhost',
        'http://localhost:443',
        'http://localhost:8080',
        'http://homeassistant.local:40850',
        'http://core-deconz.local.hass.io:40850',
      ]

      const uris = event.uri ? Array.isArray(event.uri) ? event.uri : [event.uri] : []

      uris.forEach((uri) => {
        if (!guesses.includes(uri))
          guesses.push(uri)
      })

      try {
        const discovery = await Discovery().discover()
        discovery.forEach((gateway) => {
          const uri = `http://${gateway.internalipaddress}:${gateway.internalport}`
          if (!guesses.includes(uri))
            guesses.push(uri)
        })
      }
      catch (error) {
        console.error(error)
      }

      return Promise.allSettled(guesses.map(async (uri) => {
        const client = Gateway(uri, '<nouser>', { timeout: 1500 })
        const config = await client.getConfig()
        if (config.success) {
          callback({
            type: 'Found gateway',
            id: config.success.bridgeid,
            name: config.success.name,
            version: config.success.swversion,
            uri,
          })
        }
      }))
    },
  },
})
