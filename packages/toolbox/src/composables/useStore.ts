import { readUsers } from '@directus/sdk'

export function useStore() {
  const store = useAppMachine('store')
  const client = computed(() => store.state?.context.directus)
  const profile = computed(() => store.state?.context.profile)

  // TODO find a beter way to cache this because sometime it's called twice before the first call is finished

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
    findOrCreate: () => undefined,
    getUserByKey,
  })
}
