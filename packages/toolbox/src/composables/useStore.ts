import type { RestCommand } from '@directus/sdk'
import { readUsers } from '@directus/sdk'
import type { UseAsyncStateOptions } from '@vueuse/core'
import type { MaybeRef } from 'vue'
import type { Schema } from '~/interfaces/store'

export type RequestOptions<Output extends object | unknown> = {
  initialState?: Output
  needAuth?: boolean
  debounce?: number
  maxWait?: number
} & Omit<UseAsyncStateOptions<true, Output | null>, 'shallow' | 'resetOnExecute'>

export function useStore() {
  const store = useAppMachine('store')
  const client = computed(() => store.state?.context.directus)
  const profile = computed(() => store.state?.context.profile)

  // TODO find a beter way to cache this because sometime it's called twice before the first call is finished

  function request<Output extends object | unknown>(getOptions: MaybeRef<RestCommand<Output, Schema>>, options: RequestOptions<Output> = {}) {
    const {
      needAuth = false,
      debounce = 200,
      maxWait = 2000,
      initialState = null,
    } = options

    if (!client.value)
      options.immediate = false

    const shell = useAsyncState(
      async () => {
        if (!client.value)
          return initialState

        if (needAuth === true && !profile.value)
          throw new Error('You need to be logged in to access this data')

        return await client.value.request(unref(getOptions))
      },
      initialState,
      {
        ...options,
        shallow: true,
        resetOnExecute: false,
      },
    )

    watch([client, profile], () => shell.execute())

    if (isRef(getOptions))
      watchDebounced(getOptions, () => shell.execute(), { debounce, maxWait })

    return shell

    // return result as unknown as Output
  }

  /*
  const findOrCreate = async (
    collection: string,
    searchFields: { [key: string]: string },
    createFields: { [key: string]: string },
  ) => {
    const _client = client.value
    if (!_client)
      throw new Error('Directus client is not ready')

    try {
      const result = await _client
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
        const response = await _client.collection(collection).create({
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
  */

  const getUserByKey = async (userKey: string) => {
    const data = await client.value?.request(readUsers({
      fields: ['*'],
      filter: {
        public_key: {
          _eq: userKey,
        },
      },
    }))

    if (!data || data.length === 0)
      return undefined
    return data[0]
  }

  return toReactive({
    ...toRefs(store),
    client,
    profile,
    request,
    findOrCreate: () => undefined,
    getUserByKey,
  })
}
