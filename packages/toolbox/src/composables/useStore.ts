import type { RestCommand } from '@directus/sdk'
import type { UseAsyncStateOptions } from '@vueuse/core'
import type { MaybeRef, UnwrapNestedRefs } from 'vue'

import { customEndpoint } from '@directus/sdk'
import type { UseAppMachine } from './useAppMachine'
import type { Collections, Schema } from '~/interfaces/store'

export type RequestOptions<Output extends object | unknown> = {
  initialState?: Output
  needAuth?: boolean
  debounce?: number
  maxWait?: number
} & Omit<UseAsyncStateOptions<true, Output | null>, 'shallow' | 'resetOnExecute'>

export type PublicUser = Pick<Collections.DirectusUser, 'id' | 'first_name' | 'last_name' | 'date_created' | 'public_key' | 'is_contributor'> & { avatar_url: string }

export type BundleSignatureState = 'alpha' | 'beta' | 'stable'

export function storeDownloadBundle(bundleId: string) {
  return customEndpoint<{
    success: Blob
  }>({
    method: 'GET',
    path: `/bundle/download/${bundleId}`,
    onResponse: async (response) => {
      if (response.ok) {
        return {
          success: await response.blob(),
        }
      }
    },
  })
}

export function storeSignBundle(bundleId: string, state: BundleSignatureState = 'alpha') {
  return customEndpoint<{
    success: boolean
    type: 'system'
    state: BundleSignatureState
  }>({
    method: 'POST',
    path: `/bundle/sign/${bundleId}`,
    params: {
      type: 'system',
      state,
    },
  })
}

export interface BundleDeprecateParams {
  message?: string
  type: 'version'
  bundle_id: string
}

export function storeDeprecateBundle(params: BundleDeprecateParams) {
  return customEndpoint<{
    success: boolean
  }>({
    method: 'POST',
    path: `/bundle/deprecate`,
    params: {
      ...params,
      message: params.message ?? 'null',
    },
  })
}

export function bundleSearch(filters: {
  page?: number
  limit?: number
  product?: string
  manufacturer?: string
  model?: string
  hasKey?: string
  showDeprecated?: boolean
}): RestCommand<{
  items: {
    id: string
    ddf_uuid: string
    vendor: string
    product: string
    version_deconz: string
    info: string | null
    source_last_modified: string
    content_hash: string
    device_identifiers: {
      device_identifiers_id: {
        manufacturer: string
        model: string
      }
    }[]
    signatures: {
      type: 'system' | 'user'
      key: string
    }[]
  }[]
  totalCount: number
}, Schema> {
  return () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
    return {
      method: 'GET',
      path: '/bundle/search',
      params,
    }
  }
}

export function useStore() {
  const store = useAppMachine('store')
  const client = computed(() => store.state?.context.directus)
  const profile = computed(() => store.state?.context.profile)

  // TODO find a beter way to cache this because sometime it's called twice before the first call is finished

  function request<Output extends object | unknown>(getOptions: MaybeRef<RestCommand<Output, Schema> | undefined>, options: RequestOptions<Output> = {}) {
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

        // We need to be logged in to access this data but we are not
        if (needAuth === true && !profile.value)
          return initialState

        const options = unref(getOptions)
        if (options === undefined)
          return initialState

        return await client.value.request(options)
      },
      initialState,
      {
        ...options,
        shallow: true,
        resetOnExecute: false,
      },
    )

    // Watch directus state
    watch(client, () => shell.execute())

    // We needed to be logged so we watch the profile
    if (needAuth)
      watch(profile, () => shell.execute())

    if (isRef(getOptions))
      watchDebounced(getOptions, () => shell.execute(), { debounce, maxWait })

    return shell

    // return result as unknown as Output
  }

  const getUserByKey = async (userKey: string) => {
    // TODO find a way to cache this, maybe in the machine ?
    return await client.value?.request<PublicUser | undefined>(() => {
      return {
        method: 'GET',
        path: '/bundle/userinfo',
        params: {
          userKey,
        },
      }
    })
  }

  return toReactive({
    ...toRefs(store),
    client,
    profile,
    request,
    getUserByKey,
  }) as UnwrapNestedRefs<UseAppMachine<'store'> & {
    client: typeof client
    profile: typeof profile
    request: typeof request
    getUserByKey: typeof getUserByKey
  }>
}
