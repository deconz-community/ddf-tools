export function useStore() {
  const store = useAppMachine('store')
  const client = computed(() => store.state?.context.directus)
  const profile = computed(() => store.state?.context.profile)

  // TODO find a beter way to cache this because sometime it's called twice before the first call is finished
  /*
  const getUserByKey = useMemoize(
    async (userKey: string) => {
      return await client.value?.collection(Collections.User)
        .getFirstListItem<UserResponse>(`public_key = "${userKey}"`, { requestKey: null })
    },
    {
      // Use only userId to get/set cache and ignore headers
      getKey: userId => userId,
    },
  )
  */

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

  return toReactive({
    ...toRefs(store),
    client,
    profile,
    findOrCreate: () => undefined,
    getUserByKey: () => undefined,
  })
}
