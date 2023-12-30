import { Discovery, Gateway } from '@deconz-community/rest-client'
import { produce } from 'immer'
import { assign, fromPromise, setup } from 'xstate'

export interface DiscoveryResult {
  id: string
  name: string
  version: string
  uris: string[]
}

export interface DiscoveryContext {
  results: Map<string, DiscoveryResult>
}

export const discoveryMachine = setup({
  types: {
    context: {} as DiscoveryContext,
    events: {} as {
      type: 'START_SCAN'
      uris?: string | string[]
    } | {
      type: 'STOP_SCAN'
    } | {
      type: 'GATEWAY_FOUND'
      uri: string
      id: string
      name: string
      version: string
    },
  },

  actors: {
    scanner: fromPromise<void, { uris: string | string[] }>(async ({ input, self }) => {
      const guesses = [
        'http://localhost',
        'http://localhost:443',
        'http://localhost:8080',
        'http://homeassistant.local:40850',
        'http://core-deconz.local.hass.io:40850',
      ]

      const uris = input.uris ? Array.isArray(input.uris) ? input.uris : [input.uris] : []

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

      await Promise.allSettled(guesses.map(async (uri) => {
        const client = Gateway(uri, '<nouser>', { timeout: 1500 })
        const config = await client.getConfig()
        if (config.success) {
          self._parent?.send({
            // TODO Typing for that
            type: 'GATEWAY_FOUND',
            id: config.success.bridgeid,
            name: config.success.name,
            version: config.success.swversion,
            uri,
          })
        }
      }))
    }),
  },
}).createMachine({

  id: 'discovery',

  context: (): DiscoveryContext => ({
    results: new Map(),
  }),

  initial: 'idle',

  states: {
    idle: {
      on: {
        START_SCAN: {
          target: 'scanning',
          actions: 'cleanupResults',
        },
      },
    },

    scanning: {
      invoke: {
        src: 'scanner',
        input: ({ event }) => ({
          uris: event.uris,
        }),
        onDone: 'idle',
      },

      on: {
        STOP_SCAN: 'idle',

        GATEWAY_FOUND: {
          actions: assign({
            results: ({ context, event }) => produce(context.results, (draft) => {
              console.log('GATEWAY_FOUND', event)
              const { id, name, version, uri } = event
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
        },
      },

      entry: 'cleanupResults',
    },
  },

}).provide({
  actions: {
    cleanupResults: assign({
      results: ({ context }) => produce(context.results, (draft) => {
        draft.clear()
      }),
    }),

    /*
    saveGatewayResult:
    */
  },
})
