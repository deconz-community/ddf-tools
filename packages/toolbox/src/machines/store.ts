import { assign, createMachine, sendParent } from 'xstate'
import { produce } from 'immer'
import type { AuthenticationClient, DirectusClient, RestClient, WebSocketClient } from '@directus/sdk'
import { authentication, createDirectus, readMe, readSettings, realtime, rest, serverHealth } from '@directus/sdk'
import type { Collections, Schema } from '~/interfaces/store'

type DirectusBase = DirectusClient<Schema>
  & RestClient<Schema>
  & WebSocketClient<Schema>
// & GraphqlClient<Schema>

export type Directus
  = DirectusBase | DirectusBase & AuthenticationClient<Schema>

export type PublicSettingsKeys = 'public_key_stable' | 'public_key_beta'

export interface StoreContext {
  directusUrl: string
  directus?: Directus
  profile?: Collections.DirectusUser
  settings?: Pick<Collections.DirectusSettings, PublicSettingsKeys>
  websocketEventHandlerRemover?: () => void
}

export const storeMachine = createMachine({

  id: 'store',

  types: {
    context: {} as StoreContext,
    events: {} as {
      type: 'LOGIN' | 'UPDATE_PROFILE'
      profile: Collections.DirectusUser
    } | {
      type: 'LOGOUT'
    } | {
      type: 'UPDATE_DIRECTUS_URL'
      directusUrl: string
    },
    /*
    services: {} as {
      connectToDirectus: {
        data: {
          directus: StoreContext['directus']
          settings: StoreContext['settings']
          isAuthenticated: boolean
        }
      }
      watchProfile: {
        data: void
      }
    },
    */
  },

  context: {
    // directusUrl: import.meta.env.VITE_DIRECTUS_URL
    directusUrl: 'localhost',
  },

  states: {
    init: {
      after: {
        10: 'connecting',
      },
    },

    connecting: {
      invoke: {
        src: 'connectToDirectus',
        onError: 'offline',

        onDone: [{
          target: 'online.connected',
          guard: 'isAuthenticated',
        }, 'online.anonymous'],
      },

      exit: 'useDirectus',
    },

    online: {
      states: {
        anonymous: {
          on: {
            LOGIN: {
              target: 'connected',
              actions: 'updateProfile',
            },
          },
        },

        connected: {
          on: {
            LOGOUT: {
              target: 'anonymous',
              actions: 'updateProfile',
            },

            UPDATE_PROFILE: {
              target: 'connected',
              // reenter: false, // TODO check if this is needed
              actions: 'updateProfile',
            },
          },

          invoke: {
            src: 'watchProfile',
          },

          entry: 'connectWebsocket',
          exit: 'disconnectWebsocket',
        },
      },

      initial: 'anonymous',
    },

    offline: {},
  },

  initial: 'init',

  on: {
    UPDATE_DIRECTUS_URL: {
      target: '.connecting',
      actions: [
        'updateDirectusUrl',
        'saveAppSettings',
      ],
    },
  },
}).provide({
  actions: {
    useDirectus: assign(({ context, event }) => produce(context, (draft) => {
      if (event.type === 'done.invoke.store.connecting:invocation[0]') {
        // TODO fix this, the type is not correct but it's working
        draft.directus = event.data.directus as any
        draft.settings = event.data.settings
      }
      else {
        draft.directus = undefined
        draft.settings = undefined
      }
    })),

    updateProfile: assign(({ context, event }) => produce(context, (draft) => {
      draft.profile = 'profile' in event ? event.profile : undefined
    })),

    updateDirectusUrl: assign(({ context, event }) => produce(context, (draft) => {
      draft.directusUrl = event.directusUrl
    })),

    saveAppSettings: sendParent('SAVE_SETTINGS'),

    connectWebsocket: assign(({ context }) => produce(context, (draft) => {
      context.directus?.connect()
      draft.websocketEventHandlerRemover = context.directus?.onWebSocket('message', (message) => {
        if (message.type !== 'notification')
          return
        console.log(message)
      })
    })),

    disconnectWebsocket: assign(({ context }) => produce(context, (draft) => {
      context.directus?.disconnect()
      context.websocketEventHandlerRemover?.()
      delete draft.websocketEventHandlerRemover
    })),

  },
  guards: {
    isAuthenticated: ({ event }) => event.data.isAuthenticated === true,
  },
  actors: {
    connectToDirectus: async ({ context }) => {
      const makeBaseClient = () => {
        return createDirectus<Schema>(context.directusUrl)
          .with(rest({
            onRequest: (fetchOptions) => {
              let timeout = 3000
              if (typeof fetchOptions.headers === 'object' && 'X-Timeout' in fetchOptions.headers) {
                const timeoutHeader = fetchOptions.headers['X-Timeout']
                if (typeof timeoutHeader === 'string') {
                  const converted = Number.parseInt(timeoutHeader)
                  if (!Number.isNaN(converted))
                    timeout = converted
                }
              }
              const abortController = new AbortController()
              const timeoutHandler = setTimeout(() => abortController.abort(), timeout)
              fetchOptions.signal = abortController.signal
              fetchOptions.signal.addEventListener('abort', () => clearTimeout(timeoutHandler))
              return fetchOptions
            },
            onResponse: (_result, fetchOptions) => {
              if (fetchOptions.signal?.aborted === false)
                fetchOptions.signal.dispatchEvent(new Event('abort'))
              return _result
            },
          }))
          .with(realtime({
            authMode: 'handshake',
            reconnect: {
              delay: 1000,
              retries: 10,
            },
            heartbeat: true,
          }))
      }

      const baseClient = makeBaseClient()

      const client = baseClient.with(authentication('cookie', {
        credentials: 'include', // TODO What do this does ?
      }))

      const health = await client.request(serverHealth())

      if (health.status !== 'ok')
        throw new Error('Could not connect to Directus')

      const settings = await client.request(readSettings())

      try {
        const auth = await client.refresh()
        if (auth.access_token !== null) {
          return {
            directus: client,
            settings,
            isAuthenticated: true,
          }
        }
      }
      catch (e) {
        // console.error(e)
      }

      return {
        directus: baseClient,
        settings,
        isAuthenticated: false,
      }
    },

    watchProfile: ({ context }) => async (sendBack) => {
      const profile = await context.directus?.request(readMe())
      if (profile)
        sendBack({ type: 'UPDATE_PROFILE', profile })
      // TODO get updated profile with websocket
    },

  },
})
