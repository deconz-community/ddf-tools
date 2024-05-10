import { gatewayClient } from '@deconz-community/rest-client'
import { produce } from 'immer'
import type { ActorRef } from 'xstate'
import { assertEvent, assign, fromPromise, setup } from 'xstate'

export interface DiscoveryResult {
  id: string
  name: string
  version: string
  uris: string[]
}

export interface DiscoveryContext {
  results: Map<string, DiscoveryResult>
}

interface FoundEvent {
  type: 'GATEWAY_FOUND'
  uri: string
  id: string
  name: string
  version: string
}

export const discoveryMachine = setup({
  types: {
    context: {} as DiscoveryContext,
    events: {} as {
      type: 'START_SCAN'
      uris?: string | string[]
    } | {
      type: 'STOP_SCAN'
    } | FoundEvent,
  },

  actors: {
    scanner: fromPromise(async ({ input }: { input: {
      uris: string | string[] | undefined
      discoveryMachine: ActorRef<any, FoundEvent>
    } }) => {
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
        const discoveryResult = await gatewayClient().request('discover', {})

        discoveryResult.forEach((result) => {
          if (!result.isOk())
            return

          result.value.forEach((gateway) => {
            const uri = `http://${gateway.internalipaddress}:${gateway.internalport}`
            if (!guesses.includes(uri))
              guesses.push(uri)
          })
        })
      }
      catch (error) {
        console.error(error)
      }

      await Promise.allSettled(guesses.map(async (uri) => {
        const client = gatewayClient({
          address: uri,
          timeout: 1500,
        })

        const results = await client.request('getConfig', {})

        results.forEach((result) => {
          if (!result.isOk())
            return

          const config = result.value

          input.discoveryMachine.send({
            // TODO Typing for that
            type: 'GATEWAY_FOUND',
            id: config.bridgeid,
            name: config.name,
            version: config.swversion,
            uri,
          })
        })
      }))

      toast.success('Scan complete', {
        description: `Found ${input.discoveryMachine.getSnapshot().context.results.size} gateways.`,
        id: 'scan-complete-toast',
        duration: 5000,
        onAutoClose: () => { },
        onDismiss: () => { },
        important: true,
      })
    }),
  },
  actions: {
    cleanupResults: assign({
      results: new Map(),
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
        input: ({ event, self }) => {
          assertEvent(event, 'START_SCAN')
          return {
            uris: event.uris,
            discoveryMachine: self,
          }
        },
        onDone: 'idle',
      },

      on: {
        STOP_SCAN: 'idle',
        GATEWAY_FOUND: {
          actions: assign({
            results: ({ context, event }) => produce(context.results, (draft) => {
              const { id, name, version, uri } = event
              if (draft.has(id)) {
                const result = draft.get(id)!
                result.name = name
                result.uris.push(uri)
              }
              else {
                draft.set(id, { id, name, version, uris: [uri] })
              }
            }),
          }),
        },
      },
    },
  },

})
