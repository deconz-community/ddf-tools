import type { AppType, ErrorCode } from "@deconz-community/store-api/app";
import { hc } from "hono/client";
import type { InferRequestType, InferResponseType } from "hono/client";

export type { AppType, ErrorCode };

export interface StoreClientOptions {
  url: string;
  token?: string;
  fetch?: typeof fetch;
}

export type StoreClient = ReturnType<typeof hc<AppType>>;

export type SearchBundlesQuery = InferRequestType<StoreClient["v1"]["bundles"]["$get"]>["query"];
export type SearchBundlesResult = Extract<
  InferResponseType<StoreClient["v1"]["bundles"]["$get"], 200>,
  { items: unknown }
>;
export type BundleSummary = SearchBundlesResult["items"][number];

export class StoreApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | "unknown_error",
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

export function createStoreClient(options: StoreClientOptions): StoreClient {
  return hc<AppType>(options.url, {
    fetch: options.fetch,
    headers: options.token ? { Authorization: "Bearer " + options.token } : undefined,
  });
}

async function toError(response: Response) {
  const body = (await response.json().catch(() => undefined)) as
    | { error?: { code?: ErrorCode; message?: string; details?: unknown } }
    | undefined;
  return new StoreApiError(
    response.status,
    body?.error?.code ?? "unknown_error",
    body?.error?.message ?? response.statusText,
    body?.error?.details,
  );
}

export async function searchBundles(
  client: StoreClient,
  query: SearchBundlesQuery = {},
): Promise<SearchBundlesResult> {
  const response = await client.v1.bundles.$get({ query });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as SearchBundlesResult;
}

export async function downloadBundle(client: StoreClient, id: string): Promise<Blob> {
  const response = await client.v1.bundles[":id"].download.$get({ param: { id } });
  if (!response.ok) throw await toError(response);
  return await response.blob();
}
