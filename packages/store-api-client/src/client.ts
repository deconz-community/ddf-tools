import type { AppType } from "@deconz-community/store-api/app";
import { hc } from "hono/client";

export type ServerTypedStoreClient = ReturnType<typeof hc<AppType>>;
type DdfUuidGenerationClient = {
  v1: {
    "ddf-uuids": {
      $post(input: { json: { count: number } }): Promise<Response>;
    };
  };
};

export type ErrorCode =
  | "validation_error"
  | "bundle_not_found"
  | "bundle_forbidden"
  | "contributor_required"
  | "invalid_deprecation_message"
  | "system_signing_unavailable"
  | "system_key_invalid"
  | "signing_failed";

export interface StoreClientOptions {
  url: string;
  token?: string;
  origin?: string;
  fetch?: typeof fetch;
}

export type StoreAccountErrorCode =
  | "invalid_request"
  | "email_exists"
  | "invalid_token"
  | "invalid_credentials"
  | "email_not_verified"
  | "unauthenticated"
  | "invalid_api_token"
  | "token_revoked"
  | "token_not_found"
  | "email_delivery_failed"
  | "rate_limited"
  | "profile_conflict"
  | "user_not_found"
  | "origin_not_allowed"
  | "csrf_rejected"
  | "not_found"
  | "internal_error";

export type StoreUploadState = "alpha" | "beta" | "stable";

export type StoreUploadErrorCode =
  | "validation_error"
  | "invalid_state"
  | "contributor_required"
  | "system_signing_unavailable"
  | "system_key_invalid"
  | "uploader_keypair_missing"
  | "uploader_keypair_invalid"
  | "uploader_keypair_mismatch"
  | "invalid_bundle"
  | "invalid_desc"
  | "missing_uuid"
  | "missing_version_deconz"
  | "invalid_signature"
  | "duplicate_signature"
  | "uuid_forbidden"
  | "bundle_hash_already_exists";

export type StoreBundleUploadFileResult =
  | { file: string; success: true; id: string }
  | {
      file: string;
      success: false;
      error: { code: StoreUploadErrorCode; message: string };
    };

export interface StoreBundleUploadResult {
  results: StoreBundleUploadFileResult[];
}

export interface StoreAccountClientOptions {
  url: string;
  origin?: string;
  /** API token sent as a Bearer credential; cookies are not used when set. */
  token?: string;
  fetch?: typeof fetch;
}

export interface StoreProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  public_key: string | null;
  private_key: string | null;
  is_contributor: boolean;
  email_verified: boolean;
  date_created: string;
}

export interface PublicStoreUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  public_key: string | null;
  is_contributor: boolean;
  email_verified: boolean;
  date_created: string;
}

export interface StoreProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  public_key?: string | null;
  private_key?: string | null;
}

export interface StoreApiToken {
  id: string;
  name: string;
  prefix: string;
  date_created: string;
  last_used: string | null;
  revoked: boolean;
}

export interface CreatedStoreApiToken extends StoreApiToken {
  /** Shown only once, when the token is created. */
  secret: string;
}

export interface StoreAccountClient {
  listTokens(): Promise<StoreApiToken[]>;
  createToken(name: string): Promise<CreatedStoreApiToken>;
  revokeToken(id: string): Promise<void>;
  register(input: { email: string; password: string; first_name?: string }): Promise<{
    user: { id: string; email: string };
    verification_required: boolean;
  }>;
  verifyEmail(token: string): Promise<{ verified: true }>;
  login(input: { email: string; password: string }): Promise<{ user: StoreProfile }>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<{ requested: true }>;
  confirmPasswordReset(token: string, password: string): Promise<{ reset: true }>;
  getProfile(): Promise<StoreProfile>;
  updateProfile(input: StoreProfileUpdate): Promise<StoreProfile>;
  getUserById(id: string): Promise<PublicStoreUser>;
  getUserByPublicKey(key: string): Promise<PublicStoreUser>;
}

export type StoreClient = ServerTypedStoreClient;

export interface SearchBundlesQuery {
  page?: string | string[];
  limit?: string | string[];
  vendor?: string;
  product?: string;
  manufacturer?: string;
  model?: string;
  has_key?: string;
  show_deprecated?: "true" | "false";
}

export interface BundleSignature {
  key: string;
  type: "system" | "user";
}

export interface BundleSummary {
  id: string;
  ddf_uuid: string;
  vendor: string;
  product: string;
  version_deconz: string;
  info: string | null;
  source_last_modified: string;
  content_hash: string;
  deprecation_message: string | null;
  device_identifiers: Array<{ manufacturer: string; model: string }>;
  signatures: BundleSignature[];
}

export interface SearchBundlesResult {
  items: BundleSummary[];
  total_count: number;
  page: number;
  limit: number;
}

export interface BundleDetail extends BundleSummary {
  content_size: number;
  file_count: number;
}

export interface BundleVersionsResult {
  items: BundleSummary[];
  total_count: number;
}

export interface GenerateDdfUuidsResult {
  uuids: string[];
  expire_at: string;
}

export type BundleSignatureState = "alpha" | "beta" | "stable";

export interface BundleLifecycleSignature {
  key: string;
  type: "system" | "user";
}

export interface BundleSignatureResult {
  success: true;
  state: BundleSignatureState;
  signatures: BundleLifecycleSignature[];
}

export interface BundleDeprecationResult {
  success: true;
  deprecation_message: string | null;
  signatures: BundleLifecycleSignature[];
}

export class StoreApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | StoreAccountErrorCode | StoreUploadErrorCode | "unknown_error",
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

export function createStoreClient(options: StoreClientOptions): StoreClient {
  const fetcher = options.fetch ?? fetch;
  return hc<AppType>(options.url, {
    fetch: (async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("X-Store-Request", "1");
      if (options.origin) headers.set("Origin", options.origin);
      if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
      return fetcher(input, {
        ...init,
        headers,
        credentials: options.token ? "omit" : "include",
      });
    }) as typeof fetch,
  }) as unknown as StoreClient;
}

export function createStoreAccountClient(options: StoreAccountClientOptions): StoreAccountClient {
  const fetcher = options.fetch ?? fetch;
  const baseUrl = `${options.url.replace(/\/+$/, "")}/v1`;

  async function request<T>(
    path: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ): Promise<T> {
    const headers = new Headers();
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (method !== "GET") headers.set("X-Store-Request", "1");
    if (options.origin) headers.set("Origin", options.origin);
    if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
    const response = await fetcher(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: options.token ? "omit" : "include",
    });
    if (!response.ok) throw await toError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    listTokens: async () => (await request<{ items: StoreApiToken[] }>("/me/tokens", "GET")).items,
    createToken: (name) => request("/me/tokens", "POST", { name }),
    revokeToken: (id) => request(`/me/tokens/${encodeURIComponent(id)}`, "DELETE"),
    register: (input) => request("/auth/register", "POST", input),
    verifyEmail: (token) => request("/auth/verify-email", "POST", { token }),
    login: (input) => request("/auth/login", "POST", input),
    logout: () => request("/auth/logout", "POST"),
    requestPasswordReset: (email) => request("/auth/password-reset/request", "POST", { email }),
    confirmPasswordReset: (token, password) =>
      request("/auth/password-reset/confirm", "POST", { token, password }),
    getProfile: () => request("/me", "GET"),
    updateProfile: (input) => request("/me", "PATCH", input),
    getUserById: (id) => request(`/users/${encodeURIComponent(id)}`, "GET"),
    getUserByPublicKey: (key) => request(`/users?public_key=${encodeURIComponent(key)}`, "GET"),
  };
}

async function toError(response: Response) {
  const body = (await response.json().catch(() => undefined)) as
    | { error?: { code?: string; message?: string; details?: unknown } }
    | undefined;
  return new StoreApiError(
    response.status,
    (body?.error?.code as ErrorCode | StoreAccountErrorCode | undefined) ?? "unknown_error",
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

export async function getBundle(client: StoreClient, id: string): Promise<BundleDetail> {
  const response = await client.v1.bundles[":id"].$get({
    param: { id },
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as BundleDetail;
}

export async function getBundleVersions(
  client: StoreClient,
  id: string,
): Promise<BundleVersionsResult> {
  const response = await client.v1.bundles[":id"].versions.$get({
    param: { id },
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as BundleVersionsResult;
}

export async function downloadBundle(client: StoreClient, id: string): Promise<Blob> {
  const response = await client.v1.bundles[":id"].download.$get({
    param: { id },
  });
  if (!response.ok) throw await toError(response);
  return await response.blob();
}

export async function generateDdfUuids(
  client: StoreClient,
  count: number,
): Promise<GenerateDdfUuidsResult> {
  const response = await (client as unknown as DdfUuidGenerationClient).v1["ddf-uuids"].$post({
    json: { count },
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as GenerateDdfUuidsResult;
}

export async function signBundle(
  client: StoreClient,
  id: string,
  state: BundleSignatureState,
): Promise<BundleSignatureResult> {
  const response = await client.v1.bundles[":id"].signatures.$post({
    param: { id: encodeURIComponent(id) },
    json: { state },
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as BundleSignatureResult;
}

export async function deprecateBundle(
  client: StoreClient,
  id: string,
  message: string | null,
): Promise<BundleDeprecationResult> {
  const response = await client.v1.bundles[":id"].deprecate.$post({
    param: { id: encodeURIComponent(id) },
    json: { message },
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as BundleDeprecationResult;
}

export async function uploadBundles(
  client: StoreClient,
  files: Array<{ name: string; content: Blob }>,
  state: StoreUploadState = "alpha",
): Promise<StoreBundleUploadResult> {
  const results: StoreBundleUploadResult["results"] = [];
  for (let offset = 0; offset < files.length; offset += 100) {
    const form = new FormData();
    for (const file of files.slice(offset, offset + 100)) {
      form.append("files", file.content, file.name);
    }
    const response = await client.v1.bundles.$post({ query: { state } }, { init: { body: form } });
    if (!response.ok) throw await toError(response);
    const result = (await response.json()) as StoreBundleUploadResult;
    results.push(...result.results);
  }
  return { results };
}
