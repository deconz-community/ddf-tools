import { watchEffect } from 'vue'
import {
  useInterpret as useInterpretXState,
  useMachine as useMachineXState,
} from '@xstate/vue'
import type {
  AnyInterpreter,
  AnyStateMachine,
  EventObject,
  InternalMachineOptions,
  InterpreterOptions,
  Observer,
  StateConfig, StateFrom,
} from 'xstate'

import createXStateNinjaSingleton from 'xstate-ninja'

export type MaybeLazy<T> = T | (() => T)

export interface UseMachineOptions<TContext, TEvent extends EventObject> {
  /**
   * If provided, will be merged with machine's `context`.
   */
  context?: Partial<TContext>
  /**
   * The state to rehydrate the machine to. The machine will
   * start at this state instead of its `initialState`.
   */
  state?: StateConfig<TContext, TEvent>
}

const ninja = createXStateNinjaSingleton()

export function registerNinja(actor: AnyInterpreter) {
  return watchEffect((onCleanup) => {
    if (actor.options?.devTools) {
      ninja.register(actor)
      onCleanup(() => ninja.unregister(actor))
    }
  })
}

export function useNinjaInterpret<TMachine extends AnyStateMachine>(
  getMachine: MaybeLazy<TMachine>,
  options?: InterpreterOptions &
  UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
  InternalMachineOptions<
      TMachine['__TContext'],
      TMachine['__TEvent'],
      TMachine['__TResolvedTypesMeta']
    >,
  observerOrListener?:
  | Observer<StateFrom<TMachine>>
  | ((value: StateFrom<TMachine>) => void),
) {
  const service = useInterpretXState(getMachine, options, observerOrListener)
  watchEffect((onCleanup) => {
    if (options?.devTools) {
      ninja.register(service)
      onCleanup(() => ninja.unregister(service))
    }
    return undefined
  })
  return service
}

export function useNinjaMachine<TMachine extends AnyStateMachine>(
  getMachine: MaybeLazy<TMachine>,
  options?: InterpreterOptions &
  UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
  InternalMachineOptions<
      TMachine['__TContext'],
      TMachine['__TEvent'],
      TMachine['__TResolvedTypesMeta']
    >,
) {
  const result = useMachineXState(getMachine, options)
  watchEffect((onCleanup) => {
    if (options?.devTools) {
      ninja.register(result.service)
      onCleanup(() => ninja.unregister(result.service))
    }
    return undefined
  })
  return result
}
