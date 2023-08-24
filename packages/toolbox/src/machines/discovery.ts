import { Discovery, Gateway } from '@deconz-community/rest-client'
import { produce } from 'immer'
import { assign, createMachine } from 'xstate'

export interface DiscoveryResult {
  id: string
  name: string
  uri: string[]
}

export interface DiscoveryContext {
  results: Map<string, DiscoveryResult>
}

export const discoveryMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngMQDKALpgA4AEGAhgHYDaADALqKiWawpkqYGnEAA9EAWgBMkgCwA6AJwB2AGwBWFZLUAaEAUQBGeQA4WLJdINXZ0gMxKAvg92oMOfATn0GDFAyhEAGKYAK4MENRQdGRgAO50BKwcSCDcvPyCwmIItraScipKympq9irGBiwGuvoIVrZykkq2MjKSKnnqxpIKTi5oWLiEcigQADZgpGR0eGS06IxJwml8AkIp2eIGCnJKBsZKOnqGtipyZmayLblGFn0groMeXgs+fgEQgmAjDNiYANbfR7uYbeXz+BB+P4LDLMdhLFIrWFZCSSFiNNRKUwKBQ9FRGaw1RBqAxyPJKFgdFgyYzKU62JzOEAMTAQODCYFDWpcHirTIbCS2KxEhDiCwFHFNLHGA6Y1T3TnPUYTZa85EC0XtWwi6xyNQXMwaFiyErGBUDEGeMHvVXpNYouqlc4GDRaHUGfL6g1Gk1qM2MoA */

  id: 'discovery',
  predictableActionArguments: true,
  tsTypes: {} as import('./discovery.typegen').Typegen0,

  schema: {
    context: {} as DiscoveryContext,
    events: {} as {
      type: 'Start scan'
      uri?: string
    } | {
      type: 'Stop scan'
    } | {
      type: 'Spawn worker'
      uri: string
    } | {
      type: 'Found gateway'
      uri: string
      id: string
      name: string
    },
  },

  context: (): DiscoveryContext => ({
    results: new Map(),
  }),

  states: {
    idle: {
      exit: 'cleanupResults',

      on: {
        'Start scan': 'scanning',
      },
    },

    scanning: {
      invoke: {
        src: 'scan',
        onDone: 'idle',
      },

      on: {
        'Found gateway': {
          target: 'scanning',
          actions: 'saveGatewayResult',
          internal: true,
        },
      },
    },
  },

  initial: 'idle',

  on: {
    'Stop scan': '.idle',
  },
}, {
  actions: {
    cleanupResults: assign({
      results: new Map(),
    }),

    saveGatewayResult: assign({
      results: (context, { id, name, uri }) => produce(context.results, (draft) => {
        if (draft.has(id)) {
          const result = draft.get(id)!
          result.name = name
          result.uri.push(uri)
        }
        else {
          draft.set(id, { id, name, uri: [uri] })
        }
      }),
    }),
    /*
    saveGatewayResult: (context, event) => {
      console.log({ context, event })
    },
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

      if (event.uri && !guesses.includes(event.uri))
        guesses.push(event.uri)

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
        const client = Gateway(uri, '<nouser>')
        const config = await client.getConfig()
        if (config.success) {
          console.log('found gateway', config.success.bridgeid, config.success.name, uri)

          callback({
            type: 'Found gateway',
            id: config.success.bridgeid,
            name: config.success.name,
            uri,
          })
        }
      }))
      console.log('done')
    },
  },
})
