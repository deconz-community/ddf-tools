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

    const login = await api.login({ email: registration.user.email, password: "a secure password" });
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
