import type { App, ShallowRef } from 'vue'
import createXStateNinjaSingleton from 'xstate-ninja'
import { interpret } from 'xstate'
import type { AnyStateMachine, EventFrom, InterpreterFrom, StateFrom } from 'xstate'
import { inspect } from '@xstate/inspect'
import { useSelector } from '@xstate/vue'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'

export interface MachineData<Type extends AnyStateMachine> {
  interpreter: InterpreterFrom<Type>
  state: StateFrom<Type>
  events: EventFrom<Type>
}

export interface MachinesTypes {
  app: MachineData<typeof appMachine> & {
    params: undefined
  }
  discovery: MachineData<typeof discoveryMachine> & {
    params: undefined
  }
  /*
  'discovery-worker': {
    interpreter: InterpreterFrom<typeof discoveryMachineWorker>
    params: {
      id: string
    }
  }
  */
  gateway: MachineData<typeof gatewayMachine> & {
    params: {
      id: string
    }
  }

}

const appMachineSymbol: InjectionKey<MachinesTypes['app']['interpreter']> = Symbol('AppMachine')

export function useAppMachine<Type extends keyof MachinesTypes>(
  type: Type,
  params: MachinesTypes[Type]['params'],
): {
    // actor: ShallowRef<MachinesTypes[Type]['interpreter'] | undefined>
    state: ShallowRef<MachinesTypes[Type]['state'] | undefined>
    send: MachinesTypes[Type]['interpreter']['send']
  } {
  const app = inject(appMachineSymbol)
  if (!app)
    throw new Error('useAppMachine() is called but was not created.')

  const actorRef = useSelector(app, (state) => {
    if (type === 'app')
      return app
    if (type === 'discovery')
      return state.children.discovery
    if (type === 'gateway')
      return state.children[params!.id]
    return undefined
  })

  const noop = (event: unknown) => {
    console.error('Event lost', event)
  }
  const stateRef = shallowRef<MachinesTypes[Type]['state'] | undefined>(actorRef.value?.getSnapshot())
  const sendRef = shallowRef<MachinesTypes[Type]['interpreter']['send']>(noop as any)
  const send = (event: any) => sendRef.value(event)

  watch(actorRef, (newActor, _, onCleanup) => {
    if (!newActor) {
      stateRef.value = undefined
      sendRef.value = noop as any
      return
    }

    stateRef.value = newActor.getSnapshot()
    sendRef.value = newActor.send as any
    const { unsubscribe } = newActor.subscribe({
      next: (emitted) => {
        stateRef.value = emitted
      },
      complete: () => {},
      error: () => {},
    })

    onCleanup(() => unsubscribe())
  },
  {
    immediate: true,
  })

  return {
    // actor: actorRef,
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
