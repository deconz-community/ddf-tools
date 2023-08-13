import type { ActorRefFrom } from 'xstate'
import { assign, createMachine } from 'xstate'
import { Discovery } from '../discovery'
import { Gateway } from '../gateway'

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgHEBDAFzAHciBPfEABy1gEsSmsNaAPRAWgEYAzH3Q0EPAEwAOAHQAWAJyL54gQHYADADZ1AVlmrkaEMTKUq0phha0GzVuy69JAkYh3zD6ExWrSAIkywAMZYAG5gAE6ioLYsbBxIINwI8prSfOp8OkLykuKy4nySkq4I7p7GpD7mAcFhkeZMEAA2YDaMcQ6JyXyysumZ2Xy5+YXFpb060jqGhkA */
  id: 'Gateway',
  tsTypes: {} as import('./index.typegen').Typegen0,
  predictableActionArguments: true,
  schema: {
    context: {} as { value: string },
    events: {} as { type: 'Event 1' },
  },
  states: {
    init: {},
    Discovery: {
      states: {
        idle: {},
      },

      initial: 'idle',
    },
  },
  type: 'parallel',
})

export const restMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QTAYwPYDsBeBaATnAC4B0AkpgJZEDEASmALboBuYABFAIZFgDuXAJ4BtAAwBdRKAAO6WNUpYpIAB6JcAJgCcGkloAsAZgAcAVn0A2Q1tGiA7Pv0AaEIPUbDJC7dPbTW0ztTY30HAF8wlxQMHAJicipaAEEICE4efiExSSQQWXkiRUxlNQRNO2MvczsdAEZrWwdnV3UHEjNRXwCAoJC7CKi0LDxCWFIAEUpYDDZ8QXIIABswGknp1jA5kjGufCJs5XyFJVzSw1rKrR1jWstDCvutFzcykJINH07ajQsA840BiBosM4mMSGsZpt5gAxSiYCBwqDpXgCQSwGjQ9AAV3hyMyIgkhzkx2Kp0QdhqXjsHi0xjsogsdJqz3cWhI+g0GjpFn0olqFlqnVpgOBsVGEymkK2sPhiLxqPREI2WzA8IOuSOhROoDOnJIgVEBjqdNMLIQHhIdgu+l8txC91M9gikRAmHQKHguVFI2IRIKRRK6kMvL0RjMdxs9kcZs0-nePkFxhstXpWhFQzF8Qo1D9JMDZSuVVCdQaUeaL1w9V0HS6-kCwVC6ZiPrBStmLxkxK1pJ1iFqtTZFkC3yM-kN9xjKdqls+xlsZgsAJd3tBEvW7YWy1z3fz-LsVStGlHNi0E5aZVM08FX2+P0NDlqTZB4vBkuVMLhCMwSO4KKEns7f1tVURBzH0KkrFEUJeUcfwYxMEh+wMYJ51EH4kwsZ0wiAA */
  id: 'deconz-rest',
  tsTypes: {} as import('./index.typegen').Typegen1,
  predictableActionArguments: true,
  schema: {
    context: {} as {
      credentials: Record<string, {
        id: string
        name: string
        apiKey: string
        URIs: {
          api?: string[]
          websocket?: string[]
        }
      }>
      gateways: Record<string, ActorRefFrom<typeof gatewayMachine>>
      discoveryResult: {
        id: string
        name: string
        url: string
      }[]
    },
    events: {} as
      { type: 'Add gateway' } |
      { type: 'Remove gateway' } |
      { type: 'Discovery.start' } |
      { type: 'Discovery.end' } |
      {
        type: 'Found gateway'
        data: {
          id: string
          name: string
          url: string
        }
      },
    services: {} as {
      findGateways: {
        data: void
      }
    },
  },

  context: {
    credentials: {},
    gateways: {},
    discoveryResult: [],
  },
  states: {
    Init: {
      on: {
        'Remove gateway': {
          target: 'Init',
          internal: true,
        },

        'Add gateway': {
          target: 'Init',
          internal: true,
        },
      },
    },
    Discovery: {
      states: {
        'Idle': {
          on: {
            'Discovery.start': {
              target: 'Finding gateways',
              actions: assign({
                discoveryResult: [],
              }),
            },
          },
        },
        'Finding gateways': {
          invoke: {
            src: 'findGateways',
          },

          on: {
            'Found gateway': {
              target: 'Finding gateways',

              actions: assign({
                discoveryResult: (context, event) => {
                  return [...context.discoveryResult, event.data]
                },
              }),

              internal: true,
            },

            'Discovery.end': {
              target: 'Idle',
              internal: true,
            },
          },
        },
      },

      initial: 'Idle',
    },
  },
  type: 'parallel',
}, {
  services: {

    findGateways: (context, event) => (sendBack) => {
      async function run() {
        const Guesses: { ip: string; port: number }[] = []

        // Try using localhost with various ports.
        {
          const localPorts = [80, 443, 8080]
          localPorts.forEach((port) => {
            Guesses.push({ ip: 'localhost', port })
          })
        }

        // Try using homeassistant address.
        {
          const HAAddresses = [
            'core-deconz.local.hass.io', // For the docker network
            'homeassistant.local', // For the local network
          ]
          HAAddresses.forEach((host) => {
            Guesses.push({ ip: host, port: 40850 })
          })
        }

        // Try using phoscon discovery.
        {
          const discovery = Discovery()
          try {
            const gateways = await discovery.client.discover()
            gateways.forEach((element) => {
              Guesses.push({ ip: element.internalipaddress, port: element.internalport })
            })
          }
          catch (error) {
            console.error(`Error while fetching data from Discovery url: ${error}`)
          }
        }

        // eslint-disable-next-line no-console
        console.log('Scanning for gateways, you may see errors below but just ignore them, it\'s just because there was no gateway there.')
        await Promise.all(Guesses.map(async (guess) => {
          const url = `http://${guess.ip}:${guess.port}`
          const gateway = Gateway(url, 'globalKey')

          try {
            const config = await gateway.client.getConfig()
            if (config.success) {
              sendBack({
                type: 'Found gateway',
                data: {
                  id: config.success.bridgeid,
                  name: config.success.name,
                  url,
                },
              })
            }
          }
          catch (error) {
          // Errors happen a lot here, it's not worth catching them.
          }
        }))

        sendBack({
          type: 'Discovery.end',
        })
      }

      run()
    },
  },
})
