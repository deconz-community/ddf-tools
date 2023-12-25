import { assign, fromPromise, raise, sendTo, setup } from 'xstate'
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

export const storeMachine = setup({

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
  },

}).createMachine({

  id: 'store',

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
        input: ({ context }) => ({
          directusUrl: context.directusUrl,
        }),
        src: fromPromise(async ({ input }: {
          input: {
            directusUrl: string
          }
        }) => {
          const makeBaseClient = () => {
            return createDirectus<Schema>(input.directusUrl)
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
        }),

        onError: {
          target: 'offline',
          actions: assign(({ context }) => produce(context, (draft) => {
            draft.directus = undefined
            draft.settings = undefined
          })),
        },
        onDone: [
          {
            target: 'online.connected',
            guard: ({ event }) => event.output.isAuthenticated === true,
            actions: assign(({ context, event }) => produce(context, (draft) => {
              draft.directus = event.output.directus
              draft.settings = event.output.settings
            })),
          },
          {
            target: 'online.anonymous',
            actions: assign(({ context, event }) => produce(context, (draft) => {
              draft.directus = event.output.directus
              draft.settings = event.output.settings
            })),
          },
        ],

      },
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
            input: ({ context }) => ({
              directus: context.directus,
            }),
            src: fromPromise(async ({ input }: { input: { directus: Directus } }) => {
              // TODO get updated profile with websocket
              return await input.directus?.request(readMe())
            }),
            onDone: {
              actions: ({ event }) => raise({ type: 'UPDATE_PROFILE', profile: event.output }),
            },
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
        assign(({ context, event }) => produce(context, (draft) => {
          draft.directusUrl = event.directusUrl
        })),
        sendTo(({ system }) => system.get('app'), { type: 'SAVE_SETTINGS' }),
      ],
    },
  },

  actions: {

    updateProfile: assign(({ context, event }) => produce(context, (draft) => {
      draft.profile = 'profile' in event ? event.profile : undefined
    })),

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
})
