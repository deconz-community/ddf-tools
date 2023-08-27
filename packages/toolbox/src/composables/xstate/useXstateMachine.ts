import type { Ref } from 'vue'
import { shallowRef } from 'vue'
import type {
  AnyStateMachine,
  AreAllImplementationsAssumedToBeProvided,
  InternalMachineOptions,
  InterpreterFrom,
  InterpreterOptions,
  StateFrom,
} from 'xstate'
import {
  State,
} from 'xstate'
import type { MaybeLazy, Prop, UseMachineOptions } from './types'
import { useXstateInterpret } from './useXstateInterpret'

type RestParams<
  TMachine extends AnyStateMachine,
> = AreAllImplementationsAssumedToBeProvided<
  TMachine['__TResolvedTypesMeta']
> extends false
  ? [
      options: InterpreterOptions &
      UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
      InternalMachineOptions<
          TMachine['__TContext'],
          TMachine['__TEvent'],
          TMachine['__TResolvedTypesMeta'],
          true
        >,
    ]
  : [
      options?: InterpreterOptions &
      UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
      InternalMachineOptions<
          TMachine['__TContext'],
          TMachine['__TEvent'],
          TMachine['__TResolvedTypesMeta']
        >,
    ]

interface UseMachineReturn<
  TMachine extends AnyStateMachine,
  TInterpreter = InterpreterFrom<TMachine>,
> {
  state: Ref<StateFrom<TMachine>>
  send: Prop<TInterpreter, 'send'>
  service: TInterpreter
}

export function useXstateMachine<TMachine extends AnyStateMachine>(
  getMachine: MaybeLazy<TMachine>,
  ...[options = {}]: RestParams<TMachine>
): UseMachineReturn<TMachine> {
  const state = shallowRef<StateFrom<TMachine>>(undefined as StateFrom<TMachine>)

  function listener(nextState: StateFrom<TMachine>) {
    // Only change the current state if:
    // - the incoming state is the "live" initial state (since it might have new actors)
    // - OR the incoming state actually changed.
    //
    // The "live" initial state will have .changed === undefined.
    const initialStateChanged
      = nextState.changed === undefined && Object.keys(nextState.children).length

    if (nextState.changed || initialStateChanged)
      state.value = nextState
  }

  const service = useXstateInterpret(getMachine, options, listener)

  state.value = options.state
    ? State.create(options.state)
    : service.machine.initialState

  return { state, send: service.send, service } as any
}
