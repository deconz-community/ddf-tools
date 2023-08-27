import type {
  AnyStateMachine,
  AreAllImplementationsAssumedToBeProvided,
  InternalMachineOptions,
  InterpreterFrom,
  InterpreterOptions,
  Observer,
  StateFrom,
  Subscription,
} from 'xstate'
import {
  State,
  interpret,
  toObserver,
} from 'xstate'
import type { MaybeLazy, UseMachineOptions } from './types'

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
      observerOrListener?:
        | Observer<StateFrom<TMachine>>
        | ((value: StateFrom<TMachine>) => void),
    ]
  : [
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
    ]

export function useXstateInterpret<TMachine extends AnyStateMachine>(
  getMachine: MaybeLazy<TMachine>,
  ...[options = {}, observerOrListener]: RestParams<TMachine>
): InterpreterFrom<TMachine> {
  const machine = typeof getMachine === 'function' ? getMachine() : getMachine

  const {
    context,
    guards,
    actions,
    activities,
    services,
    delays,
    state: rehydratedState,
    ...interpreterOptions
  } = options

  const machineConfig = {
    context,
    guards,
    actions,
    activities,
    services,
    delays,
  }

  const machineWithConfig = machine.withConfig(machineConfig as any, () => ({
    ...machine.context,
    ...context,
  }))

  const service = interpret(machineWithConfig, interpreterOptions).start(
    rehydratedState ? (State.create(rehydratedState) as any) : undefined,
  )

  let sub: Subscription | undefined
  if (observerOrListener)
    sub = service.subscribe(toObserver(observerOrListener as any))

  onScopeDispose(() => {
    service.stop()
    sub?.unsubscribe()
  })

  return service as any
}
