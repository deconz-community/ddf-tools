import { assign, fromPromise, raise, sendTo, setup } from 'xstate'
import { produce } from 'immer'
import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import { authentication, createDirectus, readMe, readSettings, rest, serverHealth } from '@directus/sdk'
import type { toast as vuetifyToast } from '@neoncoder/vuetify-sonner'
import type { Collections, Schema } from '~/interfaces/store'
import { toastError } from '~/lib/handleError'

// No idea why I need dynamic import here but not in other files
// const { toast } = await import(`@neoncoder/vuetify-sonner`)

// Don't look at this, it's a hack to make the linter happy
function nothing() {}
let toast: typeof vuetifyToast = Object.assign(nothing, {
  success: nothing,
  error: nothing,
  warning: nothing,
  info: nothing,
  primary: nothing,
  secondary: nothing,
  dismiss: nothing,
  toastOriginal: nothing,
}) as any

(async () => {
  toast = (await import(`@neoncoder/vuetify-sonner`)).toast
})()

export type Directus = DirectusClient<Schema>
  & RestClient<Schema>
  & AuthenticationClient<Schema>

export type DirectusSettings = Pick<Collections.DirectusSettings, PublicSettingsKeys>

export type PublicSettingsKeys = 'public_key_stable' | 'public_key_beta'

export interface StoreContext {
  directusUrl: string
  directus?: Directus
  profile?: Collections.DirectusUser & { avatar_url?: string }
  settings?: DirectusSettings
}

export const storeMachine = setup({

  types: {
    context: {} as StoreContext,
    input: {} as Partial<Pick<StoreContext, 'directusUrl'>>,
    events: {} as {
      type: 'LOGIN_WITH_PASSWORD'
      email: string
      password: string
    } | {
      type: 'LOGIN_WITH_TOKEN'
      username: string
      token: string
    } | {
      type: 'UPDATE_PROFILE'
      profile: Collections.DirectusUser
    } | {
      type: 'LOGOUT'
    } | {
      type: 'UPDATE_DIRECTUS_URL'
      directusUrl: string
    },
  },

  actors: {
    // #region fetchProfile
    fetchProfile: fromPromise(async ({ input }: { input: Directus }) => {
      return await input.request(readMe()) as Collections.DirectusUser
    }),
    // #endregion

    // #region initDirectus
    initDirectus: fromPromise<{
      isAuthenticated: boolean
      directus: Directus
      settings: DirectusSettings
    }, {
      directusUrl: string
    }>(async ({ input }) => {
      const makeClient = () => {
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
          .with(authentication('cookie', {
            credentials: 'include', // TODO What do this does ?
          }))
      }

      const client = makeClient()

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
      catch (error) {
        toastError(error)
      }

      return {
        directus: client,
        settings,
        isAuthenticated: false,
      }
    }),
    // #endregion

    // #region Login
    login: fromPromise<{
      success: boolean
    }, {
      directus: Directus
      email: string
      password: string
    }>(async ({ input }) => {
      try {
        await input.directus.login(input.email, input.password)
        toast.success('Logged in.')
      }
      catch (error) {
        toastError(error)
        return { success: false }
      }
      return { success: true }
    }),

    logout: fromPromise<void, {
      directus: Directus
    }>(async ({ input }) => {
      try {
        await input.directus.logout()
        toast.info('Logged out.')
      }
      catch (error) {
        toastError(error)
      }
    }),

    // #endregion
  },

  actions: {
    updateProfile: assign(({ context, event }) => produce(context, (draft) => {
      /*
      if (event.type !== 'UPDATE_PROFILE' && 'profile' in event === false)
        throw new Error(`Invalid event type = ${event.type}`)
      */

      const profile = event.profile as Collections.DirectusUser | undefined

      if (!profile) {
        draft.profile = undefined
        return
      }

      const avatar_url = (context.directus && profile.avatar)
        ? `${context.directus.url}assets/${profile.avatar}`
        : undefined

      draft.profile = {
        ...profile,
        avatar_url,
      }
    })),
  },

}).createMachine({

  id: 'store',

  context: ({ input }) => ({
    directusUrl: input.directusUrl ?? '',
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
        src: 'initDirectus',
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
              draft.directus = event.output.directus as any
              draft.settings = event.output.settings
            })),
          },
          {
            target: 'online.auth.anonymous',
            actions: assign(({ context, event }) => produce(context, (draft) => {
              draft.directus = event.output.directus as any
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
              on: {
                LOGIN_WITH_PASSWORD: {
                  target: 'connecting',
                },
              },
            },
            connecting: {
              invoke: {
                src: 'login',
                input: ({ context, event }) => {
                  if (event.type !== 'LOGIN_WITH_PASSWORD')
                    throw new Error('Invalid event type')

                  return { directus: context.directus!, email: event.email, password: event.password }
                },
                onDone: [
                  {
                    guard: ({ event }) => event.output.success === true,
                    target: 'connected',
                  },
                  {
                    target: 'anonymous',
                  },
                ],
              },
            },
            disconnecting: {
              invoke: {
                src: 'logout',
                input: ({ context }) => ({ directus: context.directus! }),
                onDone: {
                  target: 'anonymous',
                  actions: 'updateProfile',
                },
              },
            },
            connected: {
              on: {
                LOGOUT: {
                  target: 'disconnecting',
                },
                UPDATE_PROFILE: {
                  actions: 'updateProfile',
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
