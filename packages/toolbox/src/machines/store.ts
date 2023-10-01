import { assign, createMachine } from 'xstate'
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
  /** @xstate-layout N4IgpgJg5mDOIC5SwC4HsBOYB0BLAdrigMQAeqAhijhQGbUYAUAjAAwCUxqmOBRA2qwC6iUAAc0sIrjT5RIUogAszbADYVAViWsAHAE4A7IYBMu3QBoQAT0RsT6zbs3Mla3Yc0BmNWYC+flbcWNgAxrL4YKEoBFDEELK8+ABuaADWOME44fiR0bEIBKmhVDL4gkIV8hJSMbLyiggAtEoq2MzmRl46ar66rIZWtggqDmpemiZTXqwm+nrjAUHoITl5MfhxCZF4KemZK9kRURtQhXsldeXC-MwiSCA10vUPjU26DkrOuhPMc8zMQxfIbKP7qCZTEwzOYLLxLEBZMLHfKbYhgDAYTDYMQAGyotEwAFtsIi1icCkU0JcyhUqg8nlcGogZoZsMYvKZDLo1PoptyQSMweNJppeeMZjM1PDEbIcQQaPhZNZCWgAK6wYgAGQA8gBxACSADk6eJJM85K9EE1AQ5XDpWHpWK0OoCBYZfNgYU5PJpDHoDNLDthZfKkbkTpAtXrtQBVAAqJseZsZluaNvarQdjuduldNkQTlYbKBpmhZnmhkDPGD+DlOzJ0UjMYACgARACCcYAogB9ZsAJW1ADF9Zqu4mGWUmc0NJpsD8vCYdJpRaZgfmEFyvPOlCvWH8TO53CYAoEQIqIHB5Flqsmp6mmkDVAul6wV0Yl5YN4-t61nD4Zm5ZgXClM9ET4FBb1qe9QEaJQxg0IwfiMUxzAFVxsDfVxxh5ZgvF0L4lCrVZkVOKDzWnJoTFULwJlmZg1FmExDABfQv2GZh9CUbA3FzVwuX6B0jGInAQ0iciU1gq0eW3F9l1XT8BSUfRt2YpRSyYgwBhEms6wVJUVXVCSYIUOw50PFQ-QGd8fCUAUeSLJd3TUFigV9P4dLEo5w0bCBjJeKTmlabdCy8fRvG0VgVPYgt9FUQtfUMWi9GouEwKDNBaFoPT-ItQKJlZUUdAI8KjC4tQlPmHjnH3IEoVFKK0oCIA */

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
    directusUrl: import.meta.env.VITE_DIRECTUS_URL,
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
},
{
  actions: {
    useDirectus: assign((context, event) => produce(context, (draft) => {
      draft.directus = event.type === 'done.invoke.store.connecting:invocation[0]'
        ? event.data.directus as any // TODO fix this
        : undefined
    })),
    updateProfile: assign((context, event) => produce(context, (draft) => {
      draft.profile = 'profile' in event ? event.profile : undefined
    })),

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
        .with(authentication('cookie', {
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
