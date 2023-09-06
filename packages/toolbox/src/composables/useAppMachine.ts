import type { App, ShallowRef } from 'vue'
import createXStateNinjaSingleton from 'xstate-ninja'
import { interpret } from 'xstate'
import type { AnyStateMachine, InterpreterFrom, StateFrom } from 'xstate'
import { inspect } from '@xstate/inspect'
import { useXstateSelector } from './xstate/useXstateSelector'
import { useXstateActor } from './xstate/useXstateActor'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'
import type { gatewayMachine } from '~/machines/gateway'

export interface MachineData<Type extends AnyStateMachine> {
  interpreter: InterpreterFrom<Type>
  state: StateFrom<Type>
  // events: EventFrom<Type>
}

export type Machine =
| { type: 'app' } & MachineData<typeof appMachine>
| { type: 'discovery' } & MachineData<typeof discoveryMachine>
| { type: 'gateway' } & MachineData<typeof gatewayMachine> & { query: { id: string } }

export type ExtractMachine<Type extends Machine['type']> = Extract<Machine, { type: Type }>
export type MachineQuery<Type extends Machine['type']> = ExtractMachine<Type> extends { query: infer Query } ? Query : never

export const appMachineSymbol: InjectionKey<ExtractMachine<'app'>['interpreter']> = Symbol('AppMachine')

export function useAppMachine<Type extends Machine['type']>(
  ...args: MachineQuery<Type> extends never
    ? [type: Type]
    : [type: Type, query: MachineQuery<Type>]
): {
    actor: ShallowRef<ExtractMachine<Type>['interpreter'] | undefined>
    state: ShallowRef<ExtractMachine<Type>['state'] | undefined>
    send: ExtractMachine<Type>['interpreter']['send']
  } {
  const [type, query] = args
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
        const { id } = query as MachineQuery<'gateway'>
        if (state.children[id])
          return state.children[id]
        break
      }

      default : {
        const _exhaustiveCheck: never = type
        throw new Error(`Unhandled machine type: ${_exhaustiveCheck}`)
      }
    }

    return undefined
  })

  watch(actorRef, (newActor) => {
    // console.log('watch actorRef', type, params)
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
      // console.log('Watch', newState)
    }, { immediate: true })
  }, { immediate: true })

  return {
    actor: actorRef,
    state: stateRef,
    send,
  } as any
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
