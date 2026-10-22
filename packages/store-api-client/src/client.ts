import type { AppType, ErrorCode } from "@deconz-community/store-api/app";
import { hc } from "hono/client";
import type { InferRequestType, InferResponseType } from "hono/client";

export type { AppType, ErrorCode };

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
  | { file: string; success: true; bundle_id: string }
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
  });
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
    getProfile: () => request("/profile", "GET"),
    updateProfile: (input) => request("/profile", "PATCH", input),
    getUserById: (id) => request(`/users/${encodeURIComponent(id)}`, "GET"),
    getUserByPublicKey: (key) => request(`/users/key/${encodeURIComponent(key)}`, "GET"),
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

export async function downloadBundle(client: StoreClient, id: string): Promise<Blob> {
  const response = await client.v1.bundles[":id"].download.$get({ param: { id } });
  if (!response.ok) throw await toError(response);
  return await response.blob();
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
    form.set("state", state);
    const response = await client.v1.bundles.$post({}, { init: { body: form } });
    if (!response.ok) throw await toError(response);
    const result = (await response.json()) as StoreBundleUploadResult;
    results.push(...result.results);
  }
  return { results };
}
