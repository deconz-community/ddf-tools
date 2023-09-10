import { assign, createMachine } from 'xstate'
import PocketBase, { getTokenPayload } from 'pocketbase'
import { produce } from 'immer'
import { useCookies } from '@vueuse/integrations/useCookies'
import type { CookieSetOptions } from 'universal-cookie'

export interface StoreContext {
  pocketBaseUrl: string
  pocketBase?: PocketBase
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  created: string
  updated: string
  private_key?: string
}

export const storeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwC4HsBOYB0BLAdrigMQAeqAhijhQGbUYAUAjAAwCUxqmOBRA2qwC6iUAAc0sIrjT5RIUomYAmAJzZVAVgDsANgAcAFkP7Wy3dta6ANCACeiALSaAzNl2tDzbzs2t9qoEAvkG23FjYAMay+GCRKARQxBCyvPgAbmgA1jjhONH4sfGJCASZkVQy+IJCNfISUgmy8ooIjsz6zBqqhsrKrNqahjpahrYOCMyW2Npempp9+qasrKraIWHoEQVFCfhJYBgYmNhiADZUtJgAtth5UTFxe1ClGWgVTdXCdUggDdLNX6tFzeGbaFzaZTafS6VSLIbjJSqNyGAzeQzQ5ardahED3WRnAg0fCyOzXNAAV1gxAAMmgoAQfuJJAC5ECnP1dNhmIYXMoXKoVJY+RjEQghlzdBYXCYeS55qp9Bs8VscASiQ9Ck9ILT6ZSUEy-izPi0OVZubz+YKoawRdoxcNWDMeX0QbyFUrcfj8ITYprdjqAKpiCBUMAAAgACsdaLgzmBDf8TezJqsZrp+dpmIqzBZ-A7Fdh+S5WMwIWtkR0QriSRA4PI8vVjVVTW0TOodAEXEYAr1dMxNGLHH0usZ9ArtKpYatVMr7nwUE3Gi2U2WnYrvMps6ZzJYbPYnGW3D1xy5dCWYQPmLo56r-U9EkvWa3NFzrzCtznd7axgeEMNsFMDxX2zWYpX0Fxbx4bB1ViJ9k1AVpHGMLpO2RHsenMAcxRBLkt16VYrBUF0oIiWDiVJckqXgldEKcAU3DQ7t2z7bC-1fdQGMFKx3U0RVSLVH0NR2bUIBowE6IQZRsCGUsT0CSdlBMZQxQ47AuLYXReP4r07zQWhaF9MBxLZSSIWkwwrFks84WUcccKmQCjD0TlAmzWdqyAA */
  id: 'store',

  predictableActionArguments: true,
  tsTypes: {} as import('./store.typegen').Typegen0,

  schema: {
    context: {} as StoreContext,
    events: {} as {
      type: 'Login' | 'Update Profile'
      profile: UserProfile
    } | {
      type: 'Logout'
    },
    services: {} as {
      connectToPocketBase: {
        data: PocketBase
      }
      watchAuth: {
        data: void
      }
    },
  },

  context: {
    pocketBaseUrl: import.meta.env.VITE_POCKETBASE_URL,
  },

  states: {
    init: {
      after: {
        10: 'connecting',
      },
    },

    connecting: {
      invoke: {
        src: 'connectToPocketBase',
        onDone: {
          target: 'online',
          actions: 'usePocketBase',
        },
        onError: 'offline',
      },
    },

    online: {
      states: {
        anonymous: {
          on: {
            Login: {
              target: 'connected',
              actions: 'updateProfile',
            },
          },
        },

        connected: {
          on: {
            'Logout': {
              target: 'anonymous',
              actions: 'updateProfile',
            },

            'Update Profile': {
              target: 'connected',
              internal: true,
            },
          },
        },
      },

      initial: 'anonymous',

      invoke: {
        src: 'watchAuth',
      },
    },

    offline: {},
  },

  initial: 'init',
},
{
  actions: {
    usePocketBase: assign((context, event) => produce(context, (draft) => {
      draft.pocketBase = event.data
    })),
    updateProfile: assign((context, event) => produce(context, (draft) => {
      draft.profile = 'profile' in event ? event.profile : undefined
    })),
  },
  services: {
    connectToPocketBase: async (context) => {
      // console.log(context.pocketBaseUrl)
      const client = new PocketBase(context.pocketBaseUrl)
      const health = await client.health.check()
      if (health.code === 200)
        return client
      else
        throw new Error('Could not connect to PocketBase')
    },

    watchAuth: context => async (sendBack) => {
      const client = context.pocketBase
      if (!client)
        throw new Error('PocketBase is not initialized')

      const cookieAuthKey = 'pocketbase_auth'
      const cookieBaseParams: CookieSetOptions = {
        sameSite: 'strict',
        secure: true,
        httpOnly: false,
        path: '/',
      }
      const cookies = useCookies()

      // Restore auth cookie
      const authCookie = cookies.get(cookieAuthKey)
      if (authCookie) {
        client.authStore.save(authCookie.token, authCookie.model)
        if (client.authStore.isValid) {
          client.collection('user').authRefresh().catch((error) => {
            console.error(error)
            client.authStore.clear()
            cookies.remove('pocketbase_auth', cookieBaseParams)
          })
        }
        else { client.authStore.clear() }
      }

      // Update cookie on auth change
      const stopAuthWatcher = client.authStore.onChange((token) => {
        client.collection('user_profile').unsubscribe()

        // Clear old auth cookie
        if (!token || !client.authStore.isValid) {
          cookies.remove('pocketbase_auth', cookieBaseParams)
          sendBack({ type: 'Logout' })
          return
        }

        // Save auth cookie
        const tokenPayload = getTokenPayload(token)
        cookies.set(cookieAuthKey, {
          token: client.authStore.token,
          model: client.authStore.model,
        }, {
          ...cookieBaseParams,
          expires: new Date(tokenPayload.exp * 1000),
        })

        if (client.authStore.model) {
          client.collection('user_profile').getOne(client.authStore.model.profile).then((record) => {
            sendBack({ type: 'Login', profile: record })
          })

          client.collection('user_profile').subscribe(client.authStore.model.profile, ({ record }) => {
            sendBack({ type: 'Update Profile', profile: record })
          })
        }

        /* TODO Fix this still needed since there is a route guard module ?
        const router = useRouter()
        const route = useRoute()
        if (!client.authStore.isValid && route.meta.requiresAuth === true)
          router.push({ path: '/' })
        */
      })

      return () => {
        client.collection('user_profile').unsubscribe()
        stopAuthWatcher()
      }
    },
  },
})
