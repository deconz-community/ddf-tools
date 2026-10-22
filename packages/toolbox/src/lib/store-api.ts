import {
  createStoreClient,
  downloadBundle,
  searchBundles,
  uploadBundles,
  type StoreBundleUploadResult,
  type StoreUploadState,
  type SearchBundlesResult,
  type StoreClient,
} from "@deconz-community/store-api-client";

export type { SearchBundlesResult, StoreBundleUploadResult, StoreClient, StoreUploadState };

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

export function uploadStoreBundles(
  client: StoreClient,
  files: Array<{ name: string; content: Blob }>,
  state: StoreUploadState = "alpha",
) {
  return uploadBundles(client, files, state);
}

export function storeBundleDownloadUrl(storeUrl: string, bundleId: string) {
  return new URL("v1/bundles/" + encodeURIComponent(bundleId) + "/download", storeUrl).toString();
}
