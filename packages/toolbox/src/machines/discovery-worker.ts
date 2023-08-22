import { createMachine } from 'xstate'

export interface DiscoveryWorkerContext {
  uri: string
}

export const defaultDiscoveryWorkerContext: Readonly<DiscoveryWorkerContext> = {
  uri: '',
}

export const discoveryMachineWorker = createMachine({

  id: 'discovery-worker',

  tsTypes: {} as import('./discovery-worker.typegen').Typegen0,

  schema: {

  },
})
