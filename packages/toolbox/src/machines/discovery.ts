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
  editing?: DiscoveryResult
}

export const discoveryMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngMQCiqALgNoAMAuoqAA6awrkqYB2DIAHogFoAbAFYhAOgDsARgAskgJyyRIgEwAOaiIUAaEAURzJ46qbNjqq5SPUBfW3tQYc+AuMhsUnKEQhcw4rDkAIbkAU5YuITuFF5QNPRIIMys7Fw8-AgCAMwislJCQqrSIqai0tSysnoGCKoKxlYi2erSQpLZ0pIy9o5oka4xnt5EAMIANixgCTwpnulJmQKyCtImqkKVbYU7Qtk1iPUiUsotbR1dPQ4gES7RHuze4gCueChEAHJgvFR0syzzbiLQR7agmWRCdSSEQHBCSYriVaqSrqbLZBTqWQtXo3fp3NwPOLiYKMFAAfQA1mBiAAhYLoCkzJJzNJA0BLbIycRqbJY6GwtTqRHSZGyVHozHY663KIE2JPEnkqnEL4-JlMAGsjKCaS68RVaS8tRySX8-SIeFrJEotEYrF2aV42VDR5QcTYYLjFAQUJE17vPycAJebCYKniGWDQlPD1en2ul5vBAhzDoX1cBLq5KajhsviCbKVRGFSSFXKSWTFXTmuGqbL6kU2iX2nGR+7yt2x72+p7+oj4PCYPDiRjjUIAMyHAFsI06ox33Z7uwn-cnOKG06zM39mTmFuzBCtVOD6tIFCoNFoobD4fXZI2xbbJQ6+s5ndHO0v40TFZTqb5-HEFNwzbOVhk-OMezdX9lTXDd004bdEg1VJc21BBC2PLRqExVQNBEEoihhGtbwbUVxTtKVXwGdtwMXSCExg-8ByHEcx3ISc8BnUCXSJLtvwVUk-wIODUwQpD-lQ-d8ww+s6y0epJHUAixFUYjalI+9yKfFtHTfQYMGCThAjTThODiACgyA9cw3COdokM4zHPM7xRM3XMJN3KS8yWeohWhFplGKMU+XUw8wWoUQGgUUx0UitTW3stxHJMoyXJ8ABlchMEYAACRysxZNDgSyRSTBsZpVBkELOTChAjBMMxTAsJobES-SHNMoCIHGMAiCy4I8HIfLTMKvcfILQ1xEKUxz2C006vqKRqArGwVk2BRavamjkq65yLIAMUwZ5OAgXKoFCMAAHdggIMbvPQkVjlLZS8khM1agEGwpAUNT71KOKiO2-FeN7N4iAAVUYeMwFyiGACUAEl7sBdCBE0etKneurtHraRlLFGxmyla5OEwCA4B4UDJNRkr0YUBRwWx2EBDrY9FD+kpqEBhK9J20GoBprU6eUtYsahOrskhMjucLVotHkYH3wXf0heKg8siKIVxY+xAhBKYVtOJl9cQ6sDGKE5U1ekpYRXyJRVhEboTVC2FNmMa1H2NpX5zo2Bglwa2JowvD9RWTpucsDoqjduRpqKJtKJNniP3o5c4iDtGVHyPCNhWhTNG0WFNCFLTE+fH3aITfioMTFBM7p0oJFz92C6vSRi-PQ3y906iQdTmuLaVakG41s9ypwyt8MItTO+OT2KIrvmQcc0eZK+5FxDrORTielm5GOepOYBmKgeX50Uu9Xq16WeRj23qpmj3ms1H1XlLGoBmNq28+DL20z0o3x1JYLenRH6dFnjWA2m1ZAfy-p-H+9ggA */

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
      version: string
    } | {
      type: 'Edit'
      id: string
    } | {
      type: 'Close' | 'Next' | 'Back'
    } | {
      type: 'Update URI'
      data: string[]
    },
  },

  context: (): DiscoveryContext => ({
    results: new Map(),
    editing: undefined,
  }),

  states: {
    editing: {
      states: {
        uri: {
          on: {
            'Next': 'validating.uri',

            'Update URI': {
              target: 'uri',
              internal: true,
              actions: 'updateURI',
            },
          },
        },

        api_key: {
          on: {
            Back: 'uri',
            Next: 'validating.api_key',
          },
        },

        save: {
          type: 'final',
        },

        validating: {
          states: {
            uri: {
              invoke: {
                src: 'validateURI',
                onDone: '#discovery.editing.api_key',
                onError: '#discovery.editing.uri',
              },
            },

            api_key: {
              invoke: {
                src: 'validateAPIKey',
                onDone: '#discovery.editing.save',
                onError: '#discovery.editing.api_key',
              },
            },
          },

          initial: 'uri',
        },
      },

      initial: 'uri',

      on: {
        Close: 'scan',
      },

      onDone: 'scan',
      entry: 'setEditing',
      exit: 'setEditing',
    },

    scan: {
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
    },
  },

  on: {
    Edit: '.editing',
  },

  initial: 'scan',
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
