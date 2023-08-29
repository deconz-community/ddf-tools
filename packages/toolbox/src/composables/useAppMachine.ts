import type { App, ShallowRef } from 'vue'
import createXStateNinjaSingleton from 'xstate-ninja'
import { interpret } from 'xstate'
import type { AnyStateMachine, EventFrom, InterpreterFrom, StateFrom } from 'xstate'
import { inspect } from '@xstate/inspect'
import { useXstateSelector } from './xstate/useXstateSelector'
import { useXstateActor } from './xstate/useXstateActor'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'
import type { gatewayMachine } from '~/machines/gateway'

export interface MachineData<Type extends AnyStateMachine> {
  interpreter: InterpreterFrom<Type>
  state: StateFrom<Type>
  events: EventFrom<Type>
}

export interface MachinesTypes {
  app: MachineData<typeof appMachine> & {
    selector: {
      type: 'app'
    }
  }
  discovery: MachineData<typeof discoveryMachine> & {
    selector: {
      type: 'discovery'
    }
  }
  gateway: MachineData<typeof gatewayMachine> & {
    selector: {
      type: 'gateway'
      id: string
    }
  }
}

export type MachineType = keyof MachinesTypes

export type UseMachineSelector<Type extends MachineType> = MachinesTypes[Type]['selector']

export interface UseAppMachineReturn<Type extends MachineType> {
  // actor: ShallowRef<MachinesTypes[Type]['interpreter'] | undefined>
  state: ShallowRef<MachinesTypes[Type]['state'] | undefined>
  send: MachinesTypes[Type]['interpreter']['send']
}

export const appMachineSymbol: InjectionKey<MachinesTypes['app']['interpreter']> = Symbol('AppMachine')

// TODO Accept ref as params
export function useAppMachine<Type extends MachineType>(params: UseMachineSelector<Type>): UseAppMachineReturn<Type> {
  // console.error('useAppMachine', type, params)
  const app = inject(appMachineSymbol)
  if (!app)
    throw new Error('useAppMachine() is called but was not created.')

  const actorRef = useXstateSelector(app, (state) => {
    // console.log('useXstateSelector', type, params)
    if (params.type === 'app')
      return app
    if (params.type === 'discovery' && state.children.discovery)
      return state.children.discovery
    if (params.type === 'gateway' && state.children[params.id])
      return state.children[params.id]

    // console.log('Not found')
    return undefined
  })

  watch(actorRef, (newActor) => {
    // console.log('watch actorRef', type, params)
  })

  const logEvent = (event: unknown) => {
    console.error('Event lost', event)
  }

  const stateRef = shallowRef<MachinesTypes[Type]['state'] | undefined>(actorRef.value?.getSnapshot())
  const sendRef = shallowRef<MachinesTypes[Type]['interpreter']['send']>(logEvent as any)
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
