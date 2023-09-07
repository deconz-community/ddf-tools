import type { ShallowRef } from 'vue'
import { shallowRef } from 'vue'
import type { ActorRef, Subscribable } from 'xstate'
import { defaultGetSnapshot } from './useXstateActor'

const defaultCompare = (a: any, b: any) => a === b

export function useXstateSelector<
  TActor extends ActorRef<any, any>,
  T,
  TEmitted = TActor extends Subscribable<infer Emitted> ? Emitted : never,
>(
  actor: TActor,
  selector: (emitted: TEmitted) => T,
  compare: (a: T, b: T) => boolean = defaultCompare,
  getSnapshot: (a: TActor) => TEmitted = defaultGetSnapshot,
) {
  const selected = shallowRef() as ShallowRef<T>

  const cleanup = watchEffect(() => {
    selected.value = selector(getSnapshot(actor))
  })

  const updateSelectedIfChanged = (nextSelected: T) => {
    if (!compare(selected.value, nextSelected))
      selected.value = nextSelected
  }

  const sub = actor.subscribe((emitted) => {
    const nextSelected = selector(emitted)
    updateSelectedIfChanged(nextSelected)
  })

  onScopeDispose(() => {
    cleanup()
    sub?.unsubscribe()
  })

  return selected
}
