import type { ActorRefFrom } from 'xstate'
import { assign, createMachine } from 'xstate'
import type { discoveryMachineWorker } from './discovery-worker'

export interface DiscoveryContext {
  workers: ActorRefFrom<typeof discoveryMachineWorker>[]
}

export const defaultDiscoveryContext: Readonly<DiscoveryContext> = {
  workers: [],
}

export const discoveryMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYHsBuYBOAngHQoQA2YAxAMroCGAdgNoAMAuoqAA6awoAuKTA04gAHogCMAdgBsAGhAFE0yUQCsAX22KGmCHFGoMOfMqQgefQcNESEAWkmTF5p7J0hjWXIRLkwUSsBIRELewBmaVcVNS1NRW9TPwxGBhQGKCDeENtwxAiWWSIAJgAOSRL1GIRVDW1tIA */
  id: 'discovery',

  tsTypes: {} as import('./discovery.typegen').Typegen0,

  schema: {
    context: {} as DiscoveryContext,
  },

  context: structuredClone(defaultDiscoveryContext),

  states: {
    idle: {
      on: {
        Scan: 'scanning',
      },
    },
    scanning: {},
  },

  initial: 'idle',
  entry: 'init',
}, {
  actions: {
    init: assign({
      workers: () => {
        return []
      },
    }),
  },
})
