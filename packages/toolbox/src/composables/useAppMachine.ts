import type { App } from 'vue'
import createXStateNinjaSingleton from 'xstate-ninja'
import { interpret } from 'xstate'
import type { InterpreterFrom } from 'xstate'
import { inspect } from '@xstate/inspect'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'
import type { discoveryMachineWorker } from '~/machines/discovery-worker'

export interface MachinesTypes {
  app: {
    machine: typeof appMachine
    params: undefined
  }
  discovery: {
    machine: typeof discoveryMachine
    params: undefined
  }
  'discovery-worker': {
    machine: typeof discoveryMachineWorker
    params: {
      id: string
    }
  }
  gateway: {
    machine: typeof gatewayMachine
    params: {
      id: string
    }
  }
}

const appMachineSymbol: InjectionKey<InterpreterFrom<MachinesTypes['app']['machine']>> = Symbol('AppMachine')

export function useAppMachine<MachineType extends keyof MachinesTypes>(
  type: MachineType,
  params: MachinesTypes[MachineType]['params'],
): InterpreterFrom<MachinesTypes[MachineType]['machine']> | null {
  const app = inject(appMachineSymbol)
  if (!app)
    throw new Error('useAppMachine() is called but was not created.')

  switch (type) {
    case 'app':
      console.log(params)

      return app

    case 'discovery':
      return null
    case 'discovery-worker':
      return null
    case 'gateway':
      return null
    default:
      return null
  }
}

export function createAppMachine() {
  return markRaw({
    install(app: App) {
      const scope = effectScope(true)
      scope.run(() => {
        if (false) {
          inspect({
            iframe: false,
          })
        }

        const service = interpret(appMachine, {
          devTools: true,
        }).start()

        // Handle Ninja registration
        const ninja = createXStateNinjaSingleton()
        ninja.register(service)

        // Cleanup
        onScopeDispose(() => {
          ninja.unregister(service)
          service.stop()
        })

        app.provide(appMachineSymbol, service)
      })
    },
  })
}
