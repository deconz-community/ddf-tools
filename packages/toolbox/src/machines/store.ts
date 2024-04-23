import type { EventObject } from 'xstate'
import { assign, fromCallback, fromPromise, raise, sendTo, setup } from 'xstate'
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
  websocketWhoami?: string
}

export const storeMachine = setup({

  types: {
    context: {} as StoreContext,
    input: {} as Partial<Pick<StoreContext, 'directusUrl'>>,
    events: {} as {
      type: 'LOGIN' | 'UPDATE_PROFILE'
      profile: Collections.DirectusUser
    } | {
      type: 'LOGOUT'
    } | {
      type: 'UPDATE_DIRECTUS_URL'
      directusUrl: string
    } | {
      type: 'START_POPUP_LOGIN' | 'STOP_POPUP_LOGIN'
    } | {
      type: 'WEBSOCKET_CONNECT' | 'WEBSOCKET_DISCONNECT'
    } | {
      type: 'WEBSOCKET_MESSAGE'
      subject: 'oauth-pop-up/whoami'
      data: { whoami: string }
    },
  },

  actors: {
    fetchProfile: fromPromise(async ({ input }: { input: Directus }) => {
      return await input.request(readMe()) as Collections.DirectusUser
    }),
  },

  actions: {
    updateProfile: assign(({ context, event }) => produce(context, (draft) => {
      draft.profile = 'profile' in event ? event.profile : undefined
    })),

    connectWebsocket: assign(({ context }) => produce(context, (draft) => {
      // console.log('connectWebsocket')

      context.directus?.connect()
      draft.websocketEventHandlerRemover = context.directus?.onWebSocket('message', (message) => {
        if (message.type !== 'notification')
          return
        // console.log(message)
      })
    })),

    disconnectWebsocket: assign(({ context }) => produce(context, (draft) => {
      // console.log('disconnectWebsocket')

      context.websocketEventHandlerRemover?.()
      context.directus?.disconnect()

      // console.log(context.directus)
      delete draft.websocketEventHandlerRemover
    })),

  },

}).createMachine({

  id: 'store',

  context: ({ input }) => ({
    directusUrl: input.directusUrl ?? 'localhost',
  }),

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
                authMode: 'public',
                reconnect: false,
                // https://discord.com/channels/725371605378924594/1141759949400195122/1231346150397972561
                /*
                reconnect: {
                  delay: 1000,
                  retries: 10,
                },
                */
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
            target: 'online.auth.connected',
            guard: ({ event }) => event.output.isAuthenticated === true,
            actions: assign(({ context, event }) => produce(context, (draft) => {
              draft.directus = event.output.directus
              draft.settings = event.output.settings
            })),
          },
          {
            target: 'online.auth.anonymous',
            actions: assign(({ context, event }) => produce(context, (draft) => {
              draft.directus = event.output.directus
              draft.settings = event.output.settings
            })),
          },
        ],

      },
    },

    online: {

      type: 'parallel',

      states: {

        auth: {

          initial: 'anonymous',
          states: {
            anonymous: {
              initial: 'idle',
              states: {
                idle: {
                  on: {
                    START_POPUP_LOGIN: 'loggingIn',
                  },
                },
                loggingIn: {
                  entry: raise(() => ({ type: 'WEBSOCKET_CONNECT' })),
                  exit: raise(() => ({ type: 'WEBSOCKET_DISCONNECT' })),
                  on: {
                    STOP_POPUP_LOGIN: 'idle',
                    WEBSOCKET_MESSAGE: {
                      guard: ({ event }) => event.subject === 'oauth-pop-up/whoami',
                      actions: [
                        assign(({ context, event }) => produce(context, (draft) => {
                          draft.websocketWhoami = event.data.whoami
                        })),
                        ({ context, event }) => {
                          console.log('whoami=', event.data.whoami)

                          const url = new URL(`${context.directusUrl}/auth/login/github`)
                          const callbackUrl = new URL(`${context.directusUrl}/oauth-pop-up/callback`)
                          callbackUrl.search = new URLSearchParams({
                            whoami: event.data.whoami,
                          }).toString()

                          url.search = new URLSearchParams({
                            redirect: callbackUrl.toString(),
                          }).toString()

                          const height = 600
                          const width = 800
                          const left = (screen.width - width) / 2
                          const top = (screen.height - height) / 2

                          const newWindow = window.open(url.toString(), 'oauth-pop-up', `resizable = yes, width=${width}, height=${height}, top=${top}, left=${left}`)
                        },
                      ],
                    },
                  },
                },
              },
              on: {
                LOGIN: {
                  target: 'connected',
                  actions: 'updateProfile',
                },
              },
            },

            connected: {
              entry: raise(() => ({ type: 'WEBSOCKET_CONNECT' })),
              exit: raise(() => ({ type: 'WEBSOCKET_DISCONNECT' })),
              on: {
                LOGOUT: {
                  target: 'anonymous',
                  actions: 'updateProfile',
                },
                UPDATE_PROFILE: {
                  actions: assign({ profile: ({ event }) => event.profile }),
                },
              },

              invoke: {
                input: ({ context }) => context.directus!,
                src: 'fetchProfile',
                onDone: {
                  actions: raise(({ event }) => ({ type: 'UPDATE_PROFILE', profile: event.output })),
                },
              },
            },
          },

        },

        websocket: {
          initial: 'idle',
          states: {
            idle: {
              on: {
                WEBSOCKET_CONNECT: 'connected',
              },
            },
            connected: {
              entry: 'connectWebsocket',
              exit: 'disconnectWebsocket',
              invoke: {
                input: ({ context }) => context.directus!,
                src: fromCallback<EventObject, Directus>(({ sendBack, input }) => {
                  const stoppers: (() => void)[] = []

                  stoppers.push(input.onWebSocket('open', () => {
                    input.sendMessage({ type: 'oauth-pop-up/whoami' })
                  }))

                  stoppers.push(input.onWebSocket('message', ({ type, data }) => {
                    sendBack({
                      type: 'WEBSOCKET_MESSAGE',
                      subject: type,
                      data,
                    })
                  }))

                  return () => {
                    stoppers.forEach(stop => stop())
                  }
                }),
              },
              on: {
                WEBSOCKET_DISCONNECT: 'idle',
              },
            },
          },
        },
      },

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

})
