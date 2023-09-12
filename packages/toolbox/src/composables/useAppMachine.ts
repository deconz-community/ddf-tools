import type { App, MaybeRef } from 'vue'
import createXStateNinjaSingleton from 'xstate-ninja'
import { interpret } from 'xstate'
import type { AnyStateMachine, EventFrom, InterpreterFrom, StateFrom } from 'xstate'
import { inspect } from '@xstate/inspect'
import { useXstateActor } from './xstate/useXstateActor'
import { useXstateSelector } from './xstate/useXstateSelector'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'
import type { gatewayMachine } from '~/machines/gateway'
import type { deviceMachine } from '~/machines/device'
import type { storeMachine } from '~/machines/store'

export interface AppMachinePart<Type extends AnyStateMachine> {
  interpreter: InterpreterFrom<Type>
  state: StateFrom<Type>
  events: EventFrom<Type>
}

export type AppMachine =
| { type: 'app' } & AppMachinePart<typeof appMachine>
| { type: 'discovery' } & AppMachinePart<typeof discoveryMachine>
| { type: 'store' } & AppMachinePart<typeof storeMachine>
| { type: 'gateway' } & AppMachinePart<typeof gatewayMachine> & { query: { id: string } }
| { type: 'device' } & AppMachinePart<typeof deviceMachine> & { query: { gateway: string ; id: string } }

export type ExtractMachine<Type extends AppMachine['type']> = Extract<AppMachine, { type: Type }>
export type MachineQuery<Type extends AppMachine['type']> = ExtractMachine<Type> extends { query: infer Query } ? Query : never

export const appMachineSymbol: InjectionKey<ExtractMachine<'app'>['interpreter']> = Symbol('AppMachine')

export interface UseAppMachine<Type extends AppMachine['type']> {
  state: ExtractMachine<Type>['state'] | undefined
  send: ExtractMachine<Type>['interpreter']['send']
}

export function useAppMachine<Type extends AppMachine['type']>(
  ...args: MachineQuery<Type> extends never
    ? [type: Type]
    : [type: Type, query: MaybeRef<MachineQuery<Type>>]
): UseAppMachine<Type> {
  // console.error('useAppMachine', type, params)
  const app = inject(appMachineSymbol)
  if (!app)
    throw new Error('useAppMachine() is called but was not created.')

  return effectScope().run(() => getMachine(app, args[0], args[1])) as any
  // return scope.run(() => foo(app, ...args)) as any
}

function getMachine<Type extends AppMachine['type']>(
  app: ExtractMachine<'app'>['interpreter'],
  type: Type,
  _query?: MaybeRef<MachineQuery<Type>>,
): UseAppMachine<Type> {
  const actorRef = useXstateSelector(app, (state) => {
    switch (type) {
      case 'app':
        return app

      case 'discovery':
        if (state.children.discovery)
          return state.children.discovery
        break

      case 'store':
        if (state.children.store)
          return state.children.store
        break

      case 'gateway':{
        const query = unref(_query) as MachineQuery<'gateway'>
        const gateway = state.children[query.id]
        if (gateway)
          return gateway
        break
      }

      case 'device':{
        const device = effectScope().run(() => {
          const query = unref(_query) as MachineQuery<'device'>
          const gateway = getMachine(app, 'gateway', computed(() => ({ id: query.gateway })))
          return gateway.state?.children[query.id]
        })

        if (device)
          return device
        break
      }

      default : {
        const _exhaustiveCheck: never = type
        throw new Error(`Unhandled machine type: ${_exhaustiveCheck}`)
      }
    }

    return undefined
  })

  const logEvent = (event: unknown) => {
    console.error('Event lost', event)
  }

  const stateRef = shallowRef<ExtractMachine<Type>['state'] | undefined>(actorRef.value?.getSnapshot())
  const sendRef = shallowRef<ExtractMachine<Type>['interpreter']['send']>(logEvent as any)
  const send = (event: any) => sendRef.value(event)

  watch(actorRef, (newActor) => {
    if (!newActor) {
      stateRef.value = undefined
      sendRef.value = logEvent as any
      return
    }
    const newNewActor = useXstateActor(newActor)

    watch(newNewActor.state, (newState) => {
      sendRef.value = newNewActor.send as any
      stateRef.value = newState
    }, { immediate: true })
  }, { immediate: true })

  return reactive({
    state: stateRef,
    send,
  }) as any
}

export function createAppMachine() {
  return markRaw({
    install(app: App) {
      const scope = getCurrentScope() ?? effectScope()
      scope.run(() => {
        const toDispose: (() => void)[] = []
        const devTools = import.meta.env.VITE_DEBUG === 'true'

        console.log('Debug mode', devTools)

        if (devTools) {
          const enableInspect = true
          if (enableInspect) {
            inspect({
              iframe: false,
            })
          }
        }

        // console.log('Interpreting machine')

        const service = interpret(appMachine, {
          devTools,
        })

        // console.log('Starting service')

        service.start()
        toDispose.push(() => service.stop())

        // console.log('App machine started')

        if (devTools) {
          // Handle Ninja registration
          const ninja = createXStateNinjaSingleton()
          // Disabled for now : https://github.com/rlaffers/xstate-ninja/issues/10
          // ninja.register(service)
          // toDispose.push(() => ninja.unregister(service))
        }

        // Cleanup
        onScopeDispose(() => {
          toDispose.forEach(fn => fn())
        })

        app.provide(appMachineSymbol, service)
      })
    },
  })
}
