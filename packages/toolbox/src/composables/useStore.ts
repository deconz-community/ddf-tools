import type { PublicStoreUser } from "@deconz-community/store-api-client";
import {
  createToolboxStoreClient,
  deprecateStoreBundle,
  downloadStoreBundle,
  getStoreBundle,
  getStoreBundleVersions,
  searchStoreBundles,
  signStoreBundle,
  storeBundleDownloadUrl,
  uploadStoreBundles,
} from "~/lib/store-api";
import type {
  BundleSignatureState,
  BundleDetail,
  StoreBundleSearchFilters,
  BundleVersionsResult,
  StoreUploadState,
} from "~/lib/store-api";

export type PublicUser = PublicStoreUser & { is_contributor?: boolean };

export type { BundleSignatureState };

export function useStore() {
  const store = useAppMachine("store");
  const client = computed(() => store.state?.context.storeClient);
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

  const getBundle = async (bundleId: string): Promise<BundleDetail | undefined> =>
    bundleClient.value ? await getStoreBundle(bundleClient.value, bundleId) : undefined;

  const getBundleVersions = async (bundleId: string): Promise<BundleVersionsResult | undefined> =>
    bundleClient.value ? await getStoreBundleVersions(bundleClient.value, bundleId) : undefined;

  const bundleDownloadUrl = (bundleId: string) =>
    storeUrl.value ? storeBundleDownloadUrl(storeUrl.value, bundleId) : undefined;

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
    getUserByKey,
    searchBundles,
    downloadBundle,
    getBundle,
    getBundleVersions,
    uploadBundles,
    signBundle,
    deprecateBundle,
    bundleDownloadUrl,
  });
}
