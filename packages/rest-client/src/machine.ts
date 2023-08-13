import type { ActorRefFrom } from 'xstate'
import { createMachine } from 'xstate'

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgHEBDAFzAHciBPfEABy1gEsSmsNaAPRAWgEYAzH3Q0EPAEwAOAHQAWAJyL54gQHYADADZ1AVlmrkaEMTKUq0phha0GzVuy69JAkYh3zD6ExWrSAIkywAMZYAG5gAE6ioLYsbBxIINwI8prSfOp8OkLykuKy4nySkq4I7p7GpD7mAcFhkeZMEAA2YDaMcQ6JyXyysumZ2Xy5+YXFpb060jqGhkA */
  id: 'Gateway',
  tsTypes: {} as import('./machine.typegen').Typegen0,
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
  tsTypes: {} as import('./machine.typegen').Typegen1,
  predictableActionArguments: true,
  schema: {
    context: {} as {
      credentials: Record<string, string>
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
      // return { id: '123' }
    },
  },
})
