import { assign, createMachine, sendParent } from 'xstate'
import { produce } from 'immer'
import type { AuthenticationClient, DirectusClient, RestClient, WebSocketClient } from '@directus/sdk'
import { authentication, createDirectus, readMe, realtime, rest, serverHealth } from '@directus/sdk'
import type { Collections, Schema } from '~/interfaces/store'

export type Directus
  = DirectusClient<Schema>
  & AuthenticationClient<Schema>
  & RestClient<Schema>
  & WebSocketClient<Schema>
// & GraphqlClient<Schema>

export interface StoreContext {
  directusUrl: string
  directus?: Directus
  profile?: Collections.DirectusUser
  websocketEventHandlerRemover?: () => void
}

export const storeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwC4HsBOYB0BLAdrigMQAeqAhijhQGbUYAUAjAAwCUxqmOBRA2qwC6iUAAc0sIrjT5RIUogAszbADYVAViWsAHAE4A7IYBMu3QBoQAT0RsT6zbs3Mla3Yc0BmNWYC+flbcWNgAxrL4YKEoBFDEELK8+ABuaADWOME44fiR0bEIBKmhVDL4gkIV8hJSMbLyiggAtEoq2MzmRl46ar66rIZWtggqDmpemiZTXqwm+nrjAUHoITl5MfhxCZF4KemZK9kRURtQhXsldeXC-MwiSCA10vUPjU26DkrOuhPMc8zMQxfIbKP7qCZTEwzOYLLxLEBZMLHfKbYhgDAYTDYMQAGyotEwAFtsIi1icCkU0JcyhUqg8nlcGogZoZsMYvKZDLo1PoptyQSMweNJppeeMZjM1PDEbIcQQaPhZNZCWgAK6wYgAGQA8gBxACSADk6eJJM85K9EE1AQ5XDpWHpWK0OoCBYZfNgYU5PJpDHoDNLDthZfKkbkTpAtXrtQBVAAqJseZsZluaNvarQdjuduldNkQTlYbKBpmhZnmhkDPGD+DlOzJ0UjMYACgARACCcYAogB9ZsAJW1ADF9Zqu4mGWUmc0NJpsD8vCYdJpRaZgfmEFyvPOlCvWH8TO53CYq1hiC2O92ewBlOPa-u9mP9zUT5NT1NNLxg1q5jm9LzOO4gwbh6mhOv0rBeN0f7dAEgQgIqEBwPIWTVG+LygG8QKqAuS6sCuRhLpYG5NIY24-pMBhqMw+jjKwUrwYifAoGhtTvphyhjBoRg-EYpjmAKrjYPhrjjDyzAAV8Sinkc4YolArHmtOTQmKoUFgapaizCYhgAvoxHDDRSjYG4uauFyEGsEYMk1nWYCKSmHEzvo264cuq5EQKSguZ6QLuD83l-N00mMUGIY7BQir4MqarwPS6EWk5zBzoeKh+gMBE+EoAo8kWS7umoulAr6fw2eFsnrJADnsQoVqtNuhZePo3jaFZAECqKqiFr6ZEzB8EllbQtB2dVGG1QgEysqKOi6N5q76G4XnzCZzj7kCUKim1cF+EAA */

  id: 'store',

  predictableActionArguments: true,
  tsTypes: {} as import('./store.typegen').Typegen0,

  schema: {
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
    services: {} as {
      connectToDirectus: {
        data: {
          directus: Directus
          isAuthenticated: boolean
        }
      }
      watchProfile: {
        data: void
      }
    },
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
          cond: 'isAuthenticated',
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
              internal: true,
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
}, {
  actions: {
    useDirectus: assign((context, event) => produce(context, (draft) => {
      draft.directus = event.type === 'done.invoke.store.connecting:invocation[0]'
        ? event.data.directus as any // TODO fix this
        : undefined
    })),
    updateProfile: assign((context, event) => produce(context, (draft) => {
      draft.profile = 'profile' in event ? event.profile : undefined
    })),

    updateDirectusUrl: assign((context, event) => produce(context, (draft) => {
      draft.directusUrl = event.directusUrl
    })),

    saveAppSettings: sendParent('SAVE_SETTINGS'),

    connectWebsocket: assign(context => produce(context, (draft) => {
      context.directus?.connect()
      draft.websocketEventHandlerRemover = context.directus?.onWebSocket('message', (message) => {
        if (message.type !== 'notification')
          return
        console.log(message)
      })
    })),

    disconnectWebsocket: assign(context => produce(context, (draft) => {
      context.directus?.disconnect()
      context.websocketEventHandlerRemover?.()
      delete draft.websocketEventHandlerRemover
    })),

  },
  guards: {
    isAuthenticated: (context, event) => event.data.isAuthenticated === true,
  },
  services: {
    connectToDirectus: async (context) => {
      const client = createDirectus<Schema>(context.directusUrl)
        .with(authentication('json', {
          credentials: 'include', // TODO What do this does ?
        }))
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
        // .with(graphql())

      const health = await client.request(serverHealth())

      if (health.status !== 'ok')
        throw new Error('Could not connect to Directus')

      try {
        const auth = await client.refresh()
        if (auth.access_token !== null) {
          return {
            directus: client,
            isAuthenticated: true,
          }
        }
      }
      catch (e) {
        console.error(e)
      }

      return {
        directus: client,
        isAuthenticated: false,
      }
    },

    watchProfile: context => async (sendBack) => {
      const profile = await context.directus?.request(readMe())
      if (profile)
        sendBack({ type: 'UPDATE_PROFILE', profile })
      // TODO get updated profile with websocket
    },

  },
})
