import { useCookies } from '@vueuse/integrations/useCookies'
import PocketBase, { getTokenPayload } from 'pocketbase'
import type { CookieSetOptions } from 'universal-cookie'

export const usePocketBaseSymbol: InjectionKey<ReturnType<typeof createPocketBase>> = Symbol('PBInstance')

export interface UserProfile {
  id: string
  created: string
  name: string
  github_id?: number
  public_key?: string
  private_key?: string
}

export function usePocketBase() {
  const pocketBase = inject(usePocketBaseSymbol)
  if (!pocketBase)
    throw new Error('usePocketBase() is called but was not created.')
  return pocketBase
}

export function createPocketBase() {
  const client = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
  const cookieAuthKey = 'pocketbase_auth'
  const cookieBaseParams: CookieSetOptions = {
    sameSite: 'strict',
    secure: true,
    httpOnly: false,
    path: '/',
  }
  const cookies = useCookies()
  const profile = ref<null | UserProfile>(null)

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
  client.authStore.onChange((token) => {
    // Clear old auth cookie
    if (!token || !client.authStore.isValid) {
      cookies.remove('pocketbase_auth', cookieBaseParams)
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

    // Load user info
    if (tokenPayload.id) {
      client.collection('user_info').getOne<UserProfile>(tokenPayload.id).then((user) => {
        profile.value = user
      })
    }
    else {
      profile.value = null
    }
  })

  const findOrCreate = async (
    collection: string,
    searchFields: { [key: string]: string },
    createFields: { [key: string]: string },
  ) => {
    try {
      const result = await client
        .collection(collection)
        .getFirstListItem(
          Object.entries(searchFields)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' && '),
        )

      if (result)
        return result
      else
        throw new Error('Try to create one')
    }
    catch (e) {
      try {
        const response = await client.collection(collection).create({
          ...searchFields,
          ...createFields,
        })

        return response
      }
      catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  return { client, profile, findOrCreate }
}
