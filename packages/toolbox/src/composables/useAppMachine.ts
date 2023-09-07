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

export interface AppMachinePart<Type extends AnyStateMachine> {
  interpreter: InterpreterFrom<Type>
  state: StateFrom<Type>
  events: EventFrom<Type>
}

export type AppMachine =
| { type: 'app' } & AppMachinePart<typeof appMachine>
| { type: 'discovery' } & AppMachinePart<typeof discoveryMachine>
| { type: 'gateway' } & AppMachinePart<typeof gatewayMachine> & { query: { id: string } }

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
  const type = args[0] as Type

  // console.error('useAppMachine', type, params)
  const app = inject(appMachineSymbol)
  if (!app)
    throw new Error('useAppMachine() is called but was not created.')

  const actorRef = useXstateSelector(app, (state) => {
    switch (type) {
      case 'app':
        return app

      case 'discovery':
        if (state.children.discovery)
          return state.children.discovery
        break

      case 'gateway':{
        const query = unref(args[1]) as MachineQuery<'gateway'>
        const gateway = state.children[query.id]
        if (gateway)
          return gateway
        else
          console.warn('Gateway not found', query)
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
        if (false) {
          inspect({
            iframe: false,
          })
        }

        // console.log('Interpreting machine')

        const service = interpret(appMachine, {
          devTools: true,
        })

        // console.log('Starting service')

        service.start()

        // console.log('App machine started')

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
