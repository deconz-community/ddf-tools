import type { ActorRefFrom } from 'xstate'
import { createMachine } from 'xstate'
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
  /** @xstate-layout N4IgpgJg5mDOIC5QTAYwPYDsBeBaATnAC4B0AIgJawYBuY+AniQJIQA2YAxAGIWYQACKAEMiYAO7CGsANoAGALqJQAB3SwKRClmUgAHogBsAFhKGAjACYTxywHYAHAGZjhpwFYANCAaJz79xJLdzlQu0NLAE4nSON3JwBfBO8UDBwCYnIqWnomXn4+KCFRCSlYTggsMBI+GnQAa2rUrDxCWFJKanQ6RhJ8iELisUlpBFr0VFFtTHkFWd01DS0dJH1EezsSKzk4wztHFzcvH3W7ORIQ0LlwqJi4xOSQZvS20mZMTU4AJTAAW26wENSgx5qtFppproDAhcAFzpYHJE5BFjr4EOYHJYSHZLtcItFYvEkik0C0Mu0WB8iJwAIIQQQiYZSUGqdQQlagaGwpyGbxo8xOcwXK5426Eh6PTDoFDwVbPVrEBZs5aYKGIWGRBxBRHI4J89XmSIkSImk2WJxnQxydzGOzEp6kl6Zd6aJVLSGrLkeOz6hB2JzCq43An3e3y8kdbIAxhu9mqz0G5EkJwOf0BOyWcyGeIRX17QNhfF3ImPcOvLJdHpMVgcWMqtUw9xalNp9wZrM5yy+-ymEWikMlklpBUUzo5Xr9QaM4Gy1nujlrBDWAMWazGWwHVwebs2kh94PFiUJIA */
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
      gateways: Record<string, ActorRefFrom<typeof gatewayMachine> >
    },
    events: {} as
      { type: 'Find gateways' } |
      { type: 'Add gateway' } |
      { type: 'Remove gateway' },
    services: {} as {
      findGateways: {
        data: void
      }
    },
  },

  context: {
    credentials: {},
    gateways: {},
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
            'Find gateways': 'Finding gateways',
          },
        },
        'Finding gateways': {
          invoke: {
            src: 'findGateways',
            onDone: 'Idle',
          },
        },
      },
      initial: 'Idle',
    },
  },
  type: 'parallel',
}, {
  services: {
    findGateways: async () => {
      console.log('findGateways')

      const discovery = Discovery()
      const Guesses: { ip: string; port: number }[] = []

      try {
        const gateways = await discovery.client.discover()
        gateways.forEach((element) => {
          Guesses.push({ ip: element.internalipaddress, port: element.internalport })
        })
      }
      catch (error) {
        console.error(`Error while fetching data from Discovery url: ${error}`)
      }

      // Try using localhost with various ports.
      {
        const localPorts = [80, 443, 8080] as const
        localPorts.forEach((port) => {
          Guesses.push({ ip: 'localhost', port })
        })
      }

      // Try using homeassistant address.
      {
        const HAAddresses = [
          'core-deconz.local.hass.io', // For the docker network
          'homeassistant.local', // For the local network
        ] as const
        HAAddresses.forEach((host) => {
          Guesses.push({ ip: host, port: 40850 })
        })
      }

      // eslint-disable-next-line no-console
      console.log('Scanning for gateways, you may see errors below but just ignore them, it\'s just because there was no gateway there.')
      await Promise.all(Guesses.map(async (guess) => {
        const url = `http://${guess.ip}:${guess.port}`

        const gateway = Gateway(url, 'globalKey')

        console.log(guess)
        try {
          const config = await gateway.client.getConfig()
          console.log(config)
        }
        catch (error) {
          // Errors happen a lot here, it's not worth catching them.
        }

        /*
        const address = getURI(guess)
        const result = await findAnyGatewayAt(address)
        if (result !== undefined)
          updateData(address, result)

          */
      }))

      console.log(Guesses)

      // return { id: '123' }
    },
  },
})
