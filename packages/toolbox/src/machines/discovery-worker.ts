import { createMachine } from 'xstate'

export interface DiscoveryWorkerContext {
  uri: string
}

export const defaultDiscoveryWorkerContext: Readonly<DiscoveryWorkerContext> = {
  uri: '',
}

export const discoveryMachineWorker = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGggEtYBjLANzACcBPAWgHcsqBra-EABy1kIBdCWDBwAeiOgEYADAE50NcQGYZyNCCKkK1ek1bUAdLD4BDKnw7deAoaPEA2CfMQAWABz6ArKtVA */
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
