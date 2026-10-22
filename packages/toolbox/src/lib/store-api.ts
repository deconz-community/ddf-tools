import {
  createStoreClient,
  deprecateBundle,
  downloadBundle,
  getBundle as fetchStoreBundle,
  getBundleVersions as fetchStoreBundleVersions,
  searchBundles,
  signBundle,
  uploadBundles,
  type BundleDetail,
  type BundleSignatureState,
  type BundleSignatureResult,
  type BundleDeprecationResult,
  type BundleVersionsResult,
  type StoreBundleUploadResult,
  type StoreUploadState,
  type SearchBundlesResult,
  type StoreClient,
} from "@deconz-community/store-api-client";

export type {
  BundleDetail,
  BundleDeprecationResult,
  BundleSignatureResult,
  BundleSignatureState,
  BundleVersionsResult,
  SearchBundlesResult,
  StoreBundleUploadResult,
  StoreClient,
  StoreUploadState,
};

export interface StoreBundleSearchFilters {
  page?: number;
  limit?: number;
  vendor?: string;
  product?: string;
  manufacturer?: string;
  model?: string;
  hasKey?: string;
  showDeprecated?: boolean;
}

export function createToolboxStoreClient(url: string, fetchImpl?: typeof fetch): StoreClient {
  return createStoreClient({ url, fetch: fetchImpl });
}

export function searchStoreBundles(client: StoreClient, filters: StoreBundleSearchFilters) {
  const { page, limit, vendor, product, manufacturer, model, hasKey, showDeprecated } = filters;
  return searchBundles(client, {
    page: page === undefined ? undefined : String(page),
    limit: limit === undefined ? undefined : String(limit),
    vendor,
    product,
    manufacturer,
    model,
    has_key: hasKey,
    show_deprecated: showDeprecated === undefined ? undefined : showDeprecated ? "true" : "false",
  });
}

export function downloadStoreBundle(client: StoreClient, bundleId: string) {
  return downloadBundle(client, bundleId);
}

export function getStoreBundle(client: StoreClient, bundleId: string) {
  return fetchStoreBundle(client, bundleId);
}

export function getStoreBundleVersions(client: StoreClient, bundleId: string) {
  return fetchStoreBundleVersions(client, bundleId);
}

export function uploadStoreBundles(
  client: StoreClient,
  files: Array<{ name: string; content: Blob }>,
  state: StoreUploadState = "alpha",
) {
  return uploadBundles(client, files, state);
}

export function signStoreBundle(
  client: StoreClient,
  bundleId: string,
  state: BundleSignatureState,
): Promise<BundleSignatureResult> {
  return signBundle(client, bundleId, state);
}

export function deprecateStoreBundle(
  client: StoreClient,
  bundleId: string,
  message: string | null,
): Promise<BundleDeprecationResult> {
  return deprecateBundle(client, bundleId, message);
}

export function storeBundleDownloadUrl(storeUrl: string, bundleId: string) {
  return new URL("v1/bundles/" + encodeURIComponent(bundleId) + "/download", storeUrl).toString();
}
