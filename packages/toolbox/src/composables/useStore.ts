import type { RestCommand } from "@directus/sdk";
import type { UseAsyncStateOptions } from "@vueuse/core";
import type { MaybeRef, UnwrapNestedRefs } from "vue";

import { customEndpoint } from "@directus/sdk";
import type { PublicStoreUser } from "@deconz-community/store-api-client";
import {
  createToolboxStoreClient,
  downloadStoreBundle,
  searchStoreBundles,
  storeBundleDownloadUrl,
  uploadStoreBundles,
} from "~/lib/store-api";
import type { StoreBundleSearchFilters, StoreUploadState } from "~/lib/store-api";
import type { UseAppMachine } from "./useAppMachine";
import type { Schema } from "~/interfaces/store";

export type RequestOptions<Output extends object | unknown> = {
  initialState?: Output;
  needAuth?: boolean;
  debounce?: number;
  maxWait?: number;
} & Omit<UseAsyncStateOptions<true, Output | null>, "shallow" | "resetOnExecute">;

export type PublicUser = PublicStoreUser & { is_contributor?: boolean };

export type BundleSignatureState = "alpha" | "beta" | "stable";

export function storeSignBundle(bundleId: string, state: BundleSignatureState = "alpha") {
  return customEndpoint<{
    success: boolean;
    type: "system";
    state: BundleSignatureState;
  }>({
    method: "POST",
    path: `/bundle/sign/${bundleId}`,
    params: {
      type: "system",
      state,
    },
  });
}

export interface BundleDeprecateParams {
  message?: string;
  type: "version";
  bundle_id: string;
}

export function storeDeprecateBundle(params: BundleDeprecateParams) {
  return customEndpoint<{
    success: boolean;
  }>({
    method: "POST",
    path: `/bundle/deprecate`,
    params: {
      ...params,
      message: params.message ?? "null",
    },
  });
}

export function useStore() {
  const store = useAppMachine("store");
  const client = computed(() => store.state?.context.directus);
  const api = computed(() => store.state?.context.storeApi);
  const profile = computed(() => store.state?.context.profile);
  const storeUrl = computed(() => store.state?.context.storeApiUrl);
  const bundleClient = computed(() =>
    storeUrl.value ? createToolboxStoreClient(storeUrl.value) : undefined,
  );

  const searchBundles = async (filters: StoreBundleSearchFilters) =>
    bundleClient.value ? await searchStoreBundles(bundleClient.value, filters) : undefined;

  const downloadBundle = async (bundleId: string) =>
    bundleClient.value ? await downloadStoreBundle(bundleClient.value, bundleId) : undefined;

  const uploadBundles = async (
    files: Array<{ name: string; content: Blob }>,
    state: StoreUploadState = "alpha",
  ) =>
    bundleClient.value ? await uploadStoreBundles(bundleClient.value, files, state) : undefined;

  const bundleDownloadUrl = (bundleId: string) =>
    storeUrl.value ? storeBundleDownloadUrl(storeUrl.value, bundleId) : undefined;

  // TODO find a beter way to cache this because sometime it's called twice before the first call is finished

  function request<Output extends object | unknown>(
    getOptions: MaybeRef<RestCommand<Output, Schema> | undefined>,
    options: RequestOptions<Output> = {},
  ) {
    const { needAuth = false, debounce = 200, maxWait = 2000, initialState = null } = options;

    if (!client.value) options.immediate = false;

    const shell = useAsyncState(
      async () => {
        if (!client.value) return initialState;

        // We need to be logged in to access this data but we are not
        if (needAuth === true && !profile.value) return initialState;

        const options = unref(getOptions);
        if (options === undefined) return initialState;

        return await client.value.request(options);
      },
      initialState,
      {
        ...options,
        shallow: true,
        resetOnExecute: false,
      },
    );

    // Watch directus state
    watch(client, () => shell.execute());

    // We needed to be logged so we watch the profile
    if (needAuth) watch(profile, () => shell.execute());

    if (isRef(getOptions)) watchDebounced(getOptions, () => shell.execute(), { debounce, maxWait });

    return shell;

    // return result as unknown as Output
  }

  const getUserByKey = async (userKey: string) => {
    try {
      return await api.value?.getUserByPublicKey(userKey);
    } catch {
      return undefined;
    }
  };

  return toReactive({
    ...toRefs(store),
    client,
    api,
    profile,
    request,
    getUserByKey,
    searchBundles,
    downloadBundle,
    uploadBundles,
    bundleDownloadUrl,
  }) as UnwrapNestedRefs<
    UseAppMachine<"store"> & {
      client: typeof client;
      api: typeof api;
      profile: typeof profile;
      request: typeof request;
      getUserByKey: typeof getUserByKey;
      searchBundles: typeof searchBundles;
      downloadBundle: typeof downloadBundle;
      uploadBundles: typeof uploadBundles;
      bundleDownloadUrl: typeof bundleDownloadUrl;
    }
  >;
}
