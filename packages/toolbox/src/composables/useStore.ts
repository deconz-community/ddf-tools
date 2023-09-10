export function useStore() {
  const store = useAppMachine('store')
  const client = computed(() => store.state?.context.pocketBase)
  const profile = computed(() => store.state?.context.profile)

  const findOrCreate = async (
    collection: string,
    searchFields: { [key: string]: string },
    createFields: { [key: string]: string },
  ) => {
    const _client = client.value
    if (!_client)
      throw new Error('PocketBase client is not ready')

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

  return toReactive({
    ...toRefs(store),
    client,
    profile,
    findOrCreate,
  })
}
