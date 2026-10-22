import { afterEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../../../apps/store/src/app.js";
import { createTestStore } from "../../../apps/store/test/support.js";
import { createStoreAccountClient } from "../index.js";

const origin = "https://toolbox.example";
const stores: Array<ReturnType<typeof createTestStore>> = [];

afterEach(() => {
  for (const store of stores.splice(0)) store.client.close();
});

describe("store account client", () => {
  it("registers, verifies, logs in, updates profile, resets password, and logs out", async () => {
    const store = createTestStore();
    stores.push(store);
    const verificationMessages: Array<{ email: string; token: string }> = [];
    const resetMessages: Array<{ email: string; token: string }> = [];
    const app = createApp(store.database, {
      allowedOrigins: [origin],
      mailer: {
        async sendVerification(email, token) {
          verificationMessages.push({ email, token });
        },
        async sendPasswordReset(email, token) {
          resetMessages.push({ email, token });
        },
      },
    });
    let cookie = "";
    const api = createStoreAccountClient({
      url: "http://store.test",
      origin,
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (cookie) headers.set("Cookie", cookie);
        const response = await app.fetch(new Request(input, { ...init, headers }));
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) cookie = setCookie.split(";")[0] ?? "";
        return response;
      },
    });

    const registration = await api.register({
      email: "toolbox@example.com",
      password: "a secure password",
      first_name: "Toolbox",
    });
    expect(registration.verification_required).toBe(true);
    expect(verificationMessages).toHaveLength(1);
    await api.verifyEmail(verificationMessages[0]!.token);

    const login = await api.login({
      email: registration.user.email,
      password: "a secure password",
    });
    expect(login.user.id).toBe(registration.user.id);
    await api.updateProfile({
      avatar_url: "https://example.com/avatar.png",
      public_key: "toolbox-public-key",
      private_key: "toolbox-private-key",
    });
    expect((await api.getProfile()).private_key).toBe("toolbox-private-key");
    expect((await api.getUserById(registration.user.id)).public_key).toBe("toolbox-public-key");
    expect((await api.getUserByPublicKey("toolbox-public-key")).avatar_url).toBe(
      "https://example.com/avatar.png",
    );

    await api.requestPasswordReset(registration.user.email);
    await api.confirmPasswordReset(resetMessages[0]!.token, "a newer password");
    await expect(api.getProfile()).rejects.toMatchObject({
      status: 401,
      code: "unauthenticated",
    });
    await api.login({ email: registration.user.email, password: "a newer password" });
    await api.logout();
    await expect(api.getProfile()).rejects.toMatchObject({
      status: 401,
      code: "unauthenticated",
    });
  });
});

describe("store account client API tokens", () => {
  it("manages tokens with a session and authenticates with a bearer token without cookies", async () => {
    const store = createTestStore();
    stores.push(store);
    const app = createApp(store.database, { allowedOrigins: [origin] });
    let cookie = "";
    const sessionApi = createStoreAccountClient({
      url: "http://store.test",
      origin,
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (cookie) headers.set("Cookie", cookie);
        const response = await app.fetch(new Request(input, { ...init, headers }));
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) cookie = setCookie.split(";")[0] ?? "";
        return response;
      },
    });
    const credentials = { email: "cli@example.com", password: "a secure password" };
    await sessionApi.register(credentials);
    await sessionApi.login(credentials);

    const created = await sessionApi.createToken("laptop");
    expect(created.secret).toMatch(/^ddf_/);
    const listed = await sessionApi.listTokens();
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ id: created.id, name: "laptop", revoked: false });
    expect("secret" in listed[0]!).toBe(false);

    const seen: Array<{ authorization: string | null; credentials: RequestCredentials }> = [];
    const bearerApi = createStoreAccountClient({
      url: "http://store.test",
      token: created.secret,
      fetch: async (input, init) => {
        const request = new Request(input, init);
        seen.push({
          authorization: request.headers.get("authorization"),
          credentials: init?.credentials ?? "same-origin",
        });
        expect(request.headers.get("cookie")).toBeNull();
        return await app.fetch(request);
      },
    });
    expect(await bearerApi.getProfile()).toMatchObject({ email: "cli@example.com" });
    expect(seen[0]).toEqual({ authorization: `Bearer ${created.secret}`, credentials: "omit" });

    await sessionApi.revokeToken(created.id);
    await expect(bearerApi.getProfile()).rejects.toMatchObject({
      status: 401,
      code: "token_revoked",
    });
    await expect(sessionApi.revokeToken("missing")).rejects.toMatchObject({
      status: 404,
      code: "token_not_found",
    });
  });
});
