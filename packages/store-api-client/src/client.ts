import type { AppType, ErrorCode } from "@deconz-community/store-api/app";
import { hc } from "hono/client";
import type { InferRequestType, InferResponseType } from "hono/client";

export type { AppType, ErrorCode };

export interface StoreClientOptions {
  url: string;
  token?: string;
  fetch?: typeof fetch;
}

export type StoreAccountErrorCode =
  | "invalid_request"
  | "email_exists"
  | "invalid_token"
  | "invalid_credentials"
  | "email_not_verified"
  | "unauthenticated"
  | "email_delivery_failed"
  | "rate_limited"
  | "profile_conflict"
  | "user_not_found"
  | "origin_not_allowed"
  | "csrf_rejected"
  | "not_found"
  | "internal_error";

export interface StoreAccountClientOptions {
  url: string;
  origin?: string;
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
  email_verified: boolean;
  date_created: string;
}

export interface PublicStoreUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  public_key: string | null;
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

export interface StoreAccountClient {
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
    readonly code: ErrorCode | StoreAccountErrorCode | "unknown_error",
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

export function createStoreAccountClient(options: StoreAccountClientOptions): StoreAccountClient {
  const fetcher = options.fetch ?? fetch;
  const baseUrl = `${options.url.replace(/\/+$/, "")}/api/v1`;

  async function request<T>(
    path: string,
    method: "GET" | "POST" | "PATCH",
    body?: unknown,
  ): Promise<T> {
    const headers = new Headers();
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (method !== "GET") headers.set("X-Store-Request", "1");
    if (options.origin) headers.set("Origin", options.origin);
    const response = await fetcher(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    });
    if (!response.ok) throw await toError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
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
