import type { App, EffectScope, Prop } from 'vue'
import createXStateNinjaSingleton from 'xstate-ninja'
import { interpret } from 'xstate'
import type { AnyStateMachine, InterpreterFrom, StateFrom } from 'xstate'
import { inspect } from '@xstate/inspect'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'
import type { discoveryMachineWorker } from '~/machines/discovery-worker'

interface AppMachine<
  Type extends keyof MachinesMap = 'app',
  Machine extends AnyStateMachine = MachinesMap[Type],
  Interpreter = InterpreterFrom<Machine>,
> {
  state: Ref<StateFrom<Machine>>
  send: Prop<Interpreter, 'send'>
  service: Interpreter
}

export type UseAppMachine = AppMachine & {
  scope: EffectScope
}

export interface MachinesMap {
  app: typeof appMachine
  discovery: typeof discoveryMachine
  'discovery-worker': typeof discoveryMachineWorker
  gateway: typeof gatewayMachine
}

const appMachineSymbol: InjectionKey<InterpreterFrom<typeof appMachine>> = Symbol('AppMachine')

export type useAppMachineSelector = {
  type: 'app'
} | {
  type: 'discovery'
} | {
  type: 'discovery-worker'
  id: string
} | {
  type: 'gateway'
  id: string
}

export function useAppMachine<MachineType extends keyof MachinesMap>(type: MachineType = 'app', id?: string): InterpreterFrom<MachinesMap[MachineType]> | null {
  console.log(id)
  const app = inject(appMachineSymbol)
  if (!app)
    throw new Error('useAppMachine() is called but was not created.')

  switch (type) {
    case 'app':
      return app as any

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
