import { assign, createMachine } from 'xstate'
import { produce } from 'immer'
import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, readMe, rest, serverPing } from '@directus/sdk'
import type { Collections, Schema } from '~/interfaces/store.d.ts'

export type Directus = DirectusClient<Schema> & AuthenticationClient<Schema> & RestClient<Schema>

export interface StoreContext {
  directusUrl: string
  directus?: Directus
  profile?: Collections.DirectusUser
}

export const storeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwC4HsBOYB0BLAdrigMQAeqAhijhQGbUYAUAjAAwCUxqmOBRA2qwC6iUAAc0sIrjT5RIUogAszbADYVAViWsAHAE4A7IYBMu3QBoQAT0RsT6zbs3Mla3Yc0BmNWYC+flbcWNgAxrL4YKEoBFDEYBgYmNhiADZUtJgAttjBOOH4kdGxCAQAbmihVDL4gkJ18hJSMbLyigherIbYxl6mhrpq+iZmala2CCoOal6aJprDM52dagFB6CGyqQT5EVHUEMQAMgDyAOInAKoAKg1IIE3SrfftALTMptiuOqx6rEoqXQfcaIJysHqGJSmTojAxdNYgPLYLY7MJ7aKQYiXAAKABEAILXACiAH1sQAlE4AMQAkkciXdxJInnIXohXppDGpsLovF4TDpNAtTEpLDZEJDdDylELWMwRu53CYEUiCkUYvg4hBZLx8BUANY4VXojVQUp6yrVWR1RkPZktVmgN4A1TMcxGLw6NS+XRdEGTeXqWYjEww-R6GYqja7Qr7WLEbWRPAWw25aNo2PFTXmipVB025gie6PB1tdm6ByipyzeX6ZgfUX+qZBuYjMMRrxRnjI-DbJMUfCyaxZNAAV1gx3ONIAcraSzUywh3p9vr8-i6gYZ-VyHCZw05PJy9AYAoEQIOIHB5HlGvaF2yl2pPrz+YLhQKxRNXoYvNgAc4zH0WY1E0Vh9F0LsQj4FBb2ae8nWUaYNCMXkjFMcx-VcbBWBcNwfDrLxdFFJRIJjdVYlgllF1eExVD5UDaLUVgRkMetwMw-QlD-dx6yhcw1yMUiez7MBKNLB9Xl8LiXwFHD30bcVJiA7ATEhQwuj3TQmLrISUX7Qd8GHMd4GLO9ngQhBmE0FSNA+X5DyAjR-SGcEBS5J8G05eVdN7VE1X2SAxPghR2SUPlsDBLx9G8bQwMI5yPgi31OR-ToK2YTszyRNBaFoESgvMkKOk5CLOL0JRoqMTixkUirwSrOVIVDBY4tPPwgA */
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

      // https://github.com/directus/directus/issues/19775
      const ping = await client.request(serverPing()) as unknown as string

      // https://github.com/directus/directus/issues/19776
      // const health = await client.request(serverHealth())

      const auth = await client.refresh()

      if (ping === 'pong') {
        return {
          directus: client,
          isAuthenticated: auth.access_token !== null,
        }
      }
      else {
        throw new Error('Could not connect to Directus')
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
