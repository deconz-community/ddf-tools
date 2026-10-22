import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/database.js";
import * as schema from "../src/schema.js";

const origin = "https://toolbox.example";

describe("account registration and verification", () => {
  const databases: Array<{ close(): void }> = [];

  afterEach(() => {
    for (const database of databases.splice(0)) database.close();
  });

  it("registers an account, sends a verification message, and verifies its email", async () => {
    const client = new Database(":memory:");
    databases.push(client);
    const database = drizzle(client, { schema });
    runMigrations(database);
    const messages: Array<{ email: string; token: string }> = [];
    const resetMessages: Array<{ email: string; token: string }> = [];
    const app = createApp(database, {
      allowedOrigins: [origin],
      mailer: {
        async sendVerification(email, token) {
          messages.push({ email, token });
        },
        async sendPasswordReset(email, token) {
          resetMessages.push({ email, token });
        },
      },
    });
    const headers = { origin, "x-store-request": "1", "content-type": "application/json" };

    const registration = await app.request("/v1/auth/register", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "Person@Example.com", password: "a secure password" }),
    });

    expect(registration.status).toBe(201);
    expect(registration.headers.get("access-control-allow-origin")).toBe(origin);
    expect(registration.headers.get("access-control-allow-credentials")).toBe("true");
    expect(await registration.json()).toMatchObject({
      user: { email: "person@example.com" },
      verification_required: true,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.email).toBe("person@example.com");

    const unverifiedLogin = await app.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "person@example.com", password: "a secure password" }),
    });
    expect(unverifiedLogin.status).toBe(403);

    const verification = await app.request("/v1/auth/verify-email", {
      method: "POST",
      headers,
      body: JSON.stringify({ token: messages[0]?.token }),
    });

    expect(verification.status).toBe(200);
    expect(await verification.json()).toEqual({ verified: true });
    const reusedVerification = await app.request("/v1/auth/verify-email", {
      method: "POST",
      headers,
      body: JSON.stringify({ token: messages[0]?.token }),
    });
    expect(reusedVerification.status).toBe(400);

    const login = await app.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "person@example.com", password: "a secure password" }),
    });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toMatch(/^store_session=/);
    expect(login.headers.get("set-cookie")).toContain("HttpOnly");
    expect(login.headers.get("set-cookie")).toContain("SameSite=Lax");
    const profile = await app.request("/v1/profile", {
      headers: { cookie: cookie ?? "" },
    });
    expect(profile.status).toBe(200);
    const profileData = await profile.json();
    expect(profileData).toMatchObject({ email: "person@example.com" });
    expect(profileData.is_contributor).toBe(false);
    const reloadedApp = createApp(database, { allowedOrigins: [origin] });
    const persistedProfile = await reloadedApp.request("/v1/profile", {
      headers: { cookie: cookie ?? "" },
    });
    expect(persistedProfile.status).toBe(200);
    const secureApp = createApp(database, { allowedOrigins: [origin], secureCookies: true });
    const secureLogin = await secureApp.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "person@example.com", password: "a secure password" }),
    });
    expect(secureLogin.headers.get("set-cookie")).toContain("Secure");
    expect(secureLogin.headers.get("set-cookie")).toContain("SameSite=None");

    const profileUpdate = await app.request("/v1/profile", {
      method: "PATCH",
      headers: { ...headers, cookie: cookie ?? "" },
      body: JSON.stringify({
        first_name: "Person",
        avatar_url: "https://example.com/avatar.png",
        public_key: "public-key-1",
        private_key: "private-key-1",
      }),
    });
    expect(profileUpdate.status).toBe(200);
    expect(await profileUpdate.json()).toMatchObject({
      first_name: "Person",
      avatar_url: "https://example.com/avatar.png",
      public_key: "public-key-1",
      private_key: "private-key-1",
    });
    const attemptToChangeOwner = await app.request("/v1/profile", {
      method: "PATCH",
      headers: { ...headers, cookie: cookie ?? "" },
      body: JSON.stringify({ id: "another-user" }),
    });
    expect(attemptToChangeOwner.status).toBe(400);
    const publicProfile = await app.request("/v1/users/key/public-key-1");
    expect(publicProfile.status).toBe(200);
    const publicProfileData = await publicProfile.json();
    expect(publicProfileData).toMatchObject({
      id: profileData.id,
      avatar_url: "https://example.com/avatar.png",
      public_key: "public-key-1",
    });
    expect(publicProfileData).not.toHaveProperty("private_key");
    const publicById = await app.request(`/v1/users/${profileData.id}`);
    expect(publicById.status).toBe(200);
    expect(await publicById.json()).not.toHaveProperty("email");

    const passwordResetRequest = await app.request("/v1/auth/password-reset/request", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "person@example.com" }),
    });
    expect(passwordResetRequest.status).toBe(200);
    expect(resetMessages).toHaveLength(1);
    const resetConfirmation = await app.request("/v1/auth/password-reset/confirm", {
      method: "POST",
      headers,
      body: JSON.stringify({ token: resetMessages[0]?.token, password: "a newer password" }),
    });
    expect(resetConfirmation.status).toBe(200);
    const reusedReset = await app.request("/v1/auth/password-reset/confirm", {
      method: "POST",
      headers,
      body: JSON.stringify({ token: resetMessages[0]?.token, password: "another password" }),
    });
    expect(reusedReset.status).toBe(400);
    const invalidatedSession = await app.request("/v1/profile", {
      headers: { cookie: cookie ?? "" },
    });
    expect(invalidatedSession.status).toBe(401);
    const oldPasswordLogin = await app.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "person@example.com", password: "a secure password" }),
    });
    expect(oldPasswordLogin.status).toBe(401);
    const newPasswordLogin = await app.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "person@example.com", password: "a newer password" }),
    });
    expect(newPasswordLogin.status).toBe(200);

    const logout = await app.request("/v1/auth/logout", {
      method: "POST",
      headers: {
        ...headers,
        cookie: newPasswordLogin.headers.get("set-cookie")?.split(";")[0] ?? "",
      },
    });
    expect(logout.status).toBe(204);
    const afterLogout = await app.request("/v1/profile", {
      headers: { cookie: newPasswordLogin.headers.get("set-cookie")?.split(";")[0] ?? "" },
    });
    expect(afterLogout.status).toBe(401);
  });

  it("rejects cross-origin and headerless mutations, and rate-limits email requests", async () => {
    const client = new Database(":memory:");
    databases.push(client);
    const database = drizzle(client, { schema });
    runMigrations(database);
    const warnings: string[] = [];
    const app = createApp(database, {
      allowedOrigins: [origin],
      logger: { warn: (warning) => warnings.push(warning) },
    });
    const body = JSON.stringify({ email: "person@example.com", password: "a secure password" });

    const noOrigin = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-store-request": "1" },
      body,
    });
    expect(noOrigin.status).toBe(403);
    const untrustedOrigin = await app.request("/v1/auth/register", {
      method: "POST",
      headers: {
        origin: "https://attacker.example",
        "x-store-request": "1",
        "content-type": "application/json",
      },
      body,
    });
    expect(untrustedOrigin.status).toBe(403);
    const noCustomHeader = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body,
    });
    expect(noCustomHeader.status).toBe(403);
    const preflight = await app.request("/v1/auth/register", {
      method: "OPTIONS",
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-store-request",
      },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");
    expect(preflight.headers.get("access-control-allow-headers")).toContain("X-Store-Request");
    const registration = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { origin, "x-store-request": "1", "content-type": "application/json" },
      body,
    });
    expect(registration.status).toBe(201);
    expect(await registration.json()).toMatchObject({ verification_required: false });
    expect(warnings).toHaveLength(1);

    const resetHeaders = { origin, "x-store-request": "1", "content-type": "application/json" };
    const responses: Response[] = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push(
        await app.request("/v1/auth/password-reset/request", {
          method: "POST",
          headers: resetHeaders,
          body: JSON.stringify({ email: "unknown@example.com" }),
        }),
      );
    }
    expect(responses.slice(0, 5).every((response) => response.status === 200)).toBe(true);
    expect(responses[5]?.status).toBe(429);
    expect(await responses[5]?.json()).toMatchObject({ error: { code: "rate_limited" } });

    const ipClient = new Database(":memory:");
    databases.push(ipClient);
    const ipDatabase = drizzle(ipClient, { schema });
    runMigrations(ipDatabase);
    const ipApp = createApp(ipDatabase, { allowedOrigins: [origin] });
    const ipResponses: Response[] = [];
    for (let index = 0; index < 21; index += 1) {
      ipResponses.push(
        await ipApp.request("/v1/auth/password-reset/request", {
          method: "POST",
          headers: resetHeaders,
          body: JSON.stringify({ email: `person-${index}@example.com` }),
        }),
      );
    }
    expect(ipResponses.slice(0, 20).every((response) => response.status === 200)).toBe(true);
    expect(ipResponses[20]?.status).toBe(429);
  });
});
