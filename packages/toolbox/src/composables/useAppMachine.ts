import type { App, MaybeRef, ShallowRef } from 'vue'
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

export const appMachineSymbol: InjectionKey<ShallowRef<MachineTree>> = Symbol('AppMachine')

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

  const scope = getCurrentScope()

  if (!scope)
    throw new Error('useAppMachine() need to be called in the setup call.')

  return scope.run(() => getMachine(machineTree, args[0], args[1])) as any
}

function getMachine<Type extends AppMachine['type']>(
  machineTree: Ref<MachineTree>,
  type: Type,
  _query?: MaybeRef<MachineQuery<Type>>,
): UseAppMachine<Type> {
  const actorRef = shallowRef<Actor<any> | undefined>()

  const watchSources: Ref<any>[] = [machineTree]
  if (isRef(_query))
    watchSources.push(_query)

  watch(watchSources, () => {
    const getMachine = () => {
      switch (type) {
        case 'app':
          return machineTree.value.app

        case 'discovery':
          return machineTree.value.discovery

        case 'store':
          return machineTree.value.store

        case 'gateway':{
          const query = unref(_query) as MachineQuery<'gateway'>
          return machineTree.value.gateways.get(query.id)
        }

        case 'device':{
          const query = unref(_query) as MachineQuery<'device'>
          return machineTree.value.devices.get(`${query.gateway}-${query.id}`)
        }

        default : {
          const _exhaustiveCheck: never = type
          throw new Error(`Unhandled machine type: ${_exhaustiveCheck}`)
        }
      }
    }

    const newActor = getMachine()
    if (newActor !== actorRef.value)
      actorRef.value = newActor
  }, { immediate: true })

  const logEvent = (event: unknown) => {
    console.error('Event lost', event)
  }

  const stateRef = shallowRef<ExtractMachine<Type>['state'] | undefined>(undefined)
  const sendRef = shallowRef<ExtractMachine<Type>['actor']['send']>(logEvent as any)
  const send = (event: any) => sendRef.value(event)

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

  return reactive({
    state: stateRef,
    send,
  }) as any
}

export function createAppMachine() {
  return markRaw({
    install(app: App) {
      const inspect = import.meta.env.VITE_DEBUG === 'true'
        ? createBrowserInspector({
          url: 'https://stately.ai/registry/inspect',
        }).inspect
        : undefined

      const machineTree = shallowRef<MachineTree>({
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
                machineTree.value[type] = snapshot.actorRef as ExtractMachine<typeof type>['actor']

                snapshot.actorRef.subscribe(() => {}, undefined, () => {
                  machineTree.value[type] = undefined
                })
                break

              case 'gateway':
              case 'device':{
                const systemID = snapshot.actorRef.options.systemId as string
                machineTree.value[`${type}s`].set(systemID, snapshot.actorRef as any)

                snapshot.actorRef.subscribe(() => {}, undefined, () => {
                  machineTree.value[`${type}s`].delete(systemID)
                })

                break
              }
            }

            triggerRef(machineTree)

            return inspect?.next?.(snapshot)
          },
          error: inspect?.error,
          complete: inspect?.complete,
        },
      })

      machineTree.value.app = service

      service.start()

      app.provide(appMachineSymbol, machineTree)
    },
  })
}
