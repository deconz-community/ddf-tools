import type { RestCommand } from "@directus/sdk";
import type { UseAsyncStateOptions } from "@vueuse/core";
import type { MaybeRef, UnwrapNestedRefs } from "vue";

import type { PublicStoreUser } from "@deconz-community/store-api-client";
import {
  createToolboxStoreClient,
  deprecateStoreBundle,
  downloadStoreBundle,
  searchStoreBundles,
  signStoreBundle,
  storeBundleDownloadUrl,
  uploadStoreBundles,
} from "~/lib/store-api";
import type {
  BundleSignatureState,
  StoreBundleSearchFilters,
  StoreUploadState,
} from "~/lib/store-api";
import type { UseAppMachine } from "./useAppMachine";
import type { Schema } from "~/interfaces/store";

export type RequestOptions<Output extends object | unknown> = {
  initialState?: Output;
  needAuth?: boolean;
  debounce?: number;
  maxWait?: number;
} & Omit<UseAsyncStateOptions<true, Output | null>, "shallow" | "resetOnExecute">;

export type PublicUser = PublicStoreUser & { is_contributor?: boolean };

export type { BundleSignatureState };

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

  const signBundle = async (bundleId: string, state: BundleSignatureState) =>
    bundleClient.value ? await signStoreBundle(bundleClient.value, bundleId, state) : undefined;

  const deprecateBundle = async (bundleId: string, message: string | null) =>
    bundleClient.value
      ? await deprecateStoreBundle(bundleClient.value, bundleId, message)
      : undefined;

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
    signBundle,
    deprecateBundle,
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
      signBundle: typeof signBundle;
      deprecateBundle: typeof deprecateBundle;
      bundleDownloadUrl: typeof bundleDownloadUrl;
    }
  >;
}
