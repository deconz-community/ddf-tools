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

export interface StoreClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  origin?: string;
}

export class StoreApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

export function createStoreClient(options: StoreClientOptions) {
  const fetcher = options.fetch ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/+$/, "");

  async function request<T>(
    path: string,
    method: "GET" | "POST" | "PATCH",
    body?: unknown,
  ): Promise<T> {
    const headers = new Headers();
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (method !== "GET") headers.set("X-Store-Request", "1");
    if (options.origin) headers.set("Origin", options.origin);
    const response = await fetcher(`${baseUrl}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      throw new StoreApiError(
        payload?.error?.message ?? `Store API request failed with status ${response.status}.`,
        response.status,
        payload?.error?.code ?? "unknown_error",
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    register(input: { email: string; password: string; first_name?: string }) {
      return request<{ user: { id: string; email: string }; verification_required: boolean }>(
        "/auth/register",
        "POST",
        input,
      );
    },
    verifyEmail(token: string) {
      return request<{ verified: true }>("/auth/verify-email", "POST", { token });
    },
    login(input: { email: string; password: string }) {
      return request<{ user: StoreProfile }>("/auth/login", "POST", input);
    },
    logout() {
      return request<void>("/auth/logout", "POST");
    },
    requestPasswordReset(email: string) {
      return request<{ requested: true }>("/auth/password-reset/request", "POST", { email });
    },
    confirmPasswordReset(token: string, password: string) {
      return request<{ reset: true }>("/auth/password-reset/confirm", "POST", { token, password });
    },
    getProfile() {
      return request<StoreProfile>("/profile", "GET");
    },
    updateProfile(input: StoreProfileUpdate) {
      return request<StoreProfile>("/profile", "PATCH", input);
    },
    getUserById(id: string) {
      return request<PublicStoreUser>(`/users/${encodeURIComponent(id)}`, "GET");
    },
    getUserByPublicKey(key: string) {
      return request<PublicStoreUser>(`/users/key/${encodeURIComponent(key)}`, "GET");
    },
  };
}

export type StoreClient = ReturnType<typeof createStoreClient>;
