import type { App, EffectScope, MaybeRef } from 'vue'
import { createActor } from 'xstate'
import type { Actor, AnyStateMachine, EventFrom, StateFrom } from 'xstate'
import { createBrowserInspector } from '@statelyai/inspect'
import { appMachine } from '~/machines/app'
import type { discoveryMachine } from '~/machines/discovery'
import type { gatewayMachine } from '~/machines/gateway'
import type { deviceMachine } from '~/machines/device'
import type { storeMachine } from '~/machines/store'

export interface AppMachinePart<Type extends AnyStateMachine> {
  actor: Actor<Type>
  state: StateFrom<Type>
  events: EventFrom<Type>
}

export type AppMachine =
  | { type: 'app' } & AppMachinePart<typeof appMachine>
  | { type: 'discovery' } & AppMachinePart<typeof discoveryMachine>
  | { type: 'store' } & AppMachinePart<typeof storeMachine>
  | { type: 'gateway' } & AppMachinePart<typeof gatewayMachine> & { query: { id: string } }
  | { type: 'device' } & AppMachinePart<typeof deviceMachine> & { query: { gateway: string, id: string } }

export type ExtractMachine<Type extends AppMachine['type']> = Extract<AppMachine, { type: Type }>
export type MachineQuery<Type extends AppMachine['type']> = ExtractMachine<Type> extends { query: infer Query } ? Query : never

export interface MachineTree {
  app?: ExtractMachine<'app'>['actor']
  discovery?: ExtractMachine<'discovery'>['actor']
  store?: ExtractMachine<'store'>['actor']
  gateways: Map<string, ExtractMachine<'gateway'>['actor']>
  devices: Map<string, ExtractMachine<'device'>['actor']>
}

export const appMachineSymbol: InjectionKey<MachineTree> = Symbol('AppMachine')

export interface UseAppMachine<Type extends AppMachine['type']> {
  state: ExtractMachine<Type>['state'] | undefined
  send: ExtractMachine<Type>['actor']['send']
}

export function useAppMachine<Type extends AppMachine['type']>(
  ...args: MachineQuery<Type> extends never
    ? [type: Type]
    : [type: Type, query: MaybeRef<MachineQuery<Type>>]
): UseAppMachine<Type> {
  // console.error('useAppMachine', type, params)
  const machineTree = inject(appMachineSymbol)
  if (!machineTree)
    throw new Error('useAppMachine() is called but was not created.')

  const scope = getCurrentScope() ?? effectScope()

  return scope.run(() => getMachine(scope, machineTree, args[0], args[1])) as any
}

function getMachine<Type extends AppMachine['type']>(
  scope: EffectScope,
  machineTree: MachineTree,
  type: Type,
  _query?: MaybeRef<MachineQuery<Type>>,
): UseAppMachine<Type> {
  const actorRef = computed(() => {
    switch (type) {
      case 'app':
        return machineTree.app

      case 'discovery':
        return machineTree.discovery

      case 'store':
        return machineTree.store

      case 'gateway':
        return machineTree.gateways.get(_query.id)

      case 'device':
        return machineTree.devices.get(`${_query.gateway}-${_query.id}`)

      default : {
        const _exhaustiveCheck: never = type
        throw new Error(`Unhandled machine type: ${_exhaustiveCheck}`)
      }
    }
  })

  const logEvent = (event: unknown) => {
    console.error('Event lost', event)
  }

  const stateRef = shallowRef<ExtractMachine<Type>['state'] | undefined>(undefined)
  const sendRef = shallowRef<ExtractMachine<Type>['actor']['send']>(logEvent as any)
  const send = (event: any) => sendRef.value(event)

  scope.run(() => {
    watch(actorRef, (newActor, _, onCleanup) => {
      if (!newActor) {
        stateRef.value = undefined
        sendRef.value = logEvent as any
        return
      }

      stateRef.value = newActor.getSnapshot()

      const { unsubscribe } = newActor.subscribe((state) => {
        stateRef.value = state
      })
      onCleanup(() => unsubscribe())
    }, { immediate: true })
  })

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

        const inspect = import.meta.env.VITE_DEBUG === 'true'
          ? createBrowserInspector({
            url: 'https://stately.ai/registry/inspect',
          }).inspect
          : undefined

        const machineTree = reactive<MachineTree>({
          app: undefined,
          discovery: undefined,
          store: undefined,
          gateways: new Map(),
          devices: new Map(),
        })

        const service = createActor(appMachine, {
          id: 'app',
          systemId: 'app',
          inspect: {
            next: (snapshot) => {
              if (
                snapshot.type !== '@xstate.actor'
                || !('options' in snapshot.actorRef)
                || typeof snapshot.actorRef.options !== 'object'
                || snapshot.actorRef.options === null
                || !('systemId' in snapshot.actorRef.options)
                || typeof snapshot.actorRef.options.systemId !== 'string'
              )
                return inspect?.next?.(snapshot)

              const type = snapshot.actorRef.id

              switch (type) {
                case 'app':
                case 'store':
                case 'discovery':
                  // @ts-expect-error The key is valid
                  machineTree[type] = markRaw(snapshot.actorRef) as ExtractMachine<typeof type>['actor']

                  snapshot.actorRef.subscribe(() => {}, undefined, () => {
                    machineTree[type] = undefined
                  })
                  break

                case 'gateway':
                case 'device':{
                  const systemID = snapshot.actorRef.options.systemId as string
                  machineTree[`${type}s`].set(systemID, markRaw(snapshot.actorRef) as any)

                  snapshot.actorRef.subscribe(() => {}, undefined, () => {
                    machineTree[`${type}s`].delete(systemID)
                  })

                  break
                }
              }

              return inspect?.next?.(snapshot)
            },
            error: inspect?.error,
            complete: inspect?.complete,
          },
        })

        machineTree.app = service

        service.start()

        toDispose.push(() => service.stop())

        // Cleanup
        onScopeDispose(() => {
          toDispose.forEach(fn => fn())
        })

        app.provide(appMachineSymbol, machineTree)
      })
    },
  })
}
