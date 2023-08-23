import { createMachine } from 'xstate'

export interface DiscoveryWorkerContext {
  uri: string
}

export const defaultDiscoveryWorkerContext: Readonly<DiscoveryWorkerContext> = {
  uri: '',
}

export const discoveryMachineWorker = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGggEtYBjLANzACcBPAWgHcsqBra-EABy1kIBdCWDBwAeiABwB2dDUQBGACzI0IIqQrV6TVtQB0sPgEMqfDt14Cho+QGYArDPkAGJ7rvLlQA */
  id: 'discovery-worker',
  predictableActionArguments: true,
  tsTypes: {} as import('./discovery-worker.typegen').Typegen0,

  schema: {
    context: {} as {
      uri: string
    },
  },

  states: {
    start: {},
  },

  initial: 'start',
})
