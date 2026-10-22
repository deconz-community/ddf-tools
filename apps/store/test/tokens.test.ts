import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/database.js";
import * as schema from "../src/schema.js";

const origin = "https://toolbox.example";
const headers = { origin, "x-store-request": "1", "content-type": "application/json" };
const clients: Array<{ close(): void }> = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

function setup() {
  const client = new Database(":memory:");
  clients.push(client);
  const database = drizzle(client, { schema });
  runMigrations(database);
  const app = createApp(database, { allowedOrigins: [origin] });
  return { app, client };
}

async function signIn(app: ReturnType<typeof createApp>, email: string) {
  const credentials = JSON.stringify({ email, password: "a secure password" });
  await app.request("/v1/auth/register", { method: "POST", headers, body: credentials });
  const login = await app.request("/v1/auth/login", {
    method: "POST",
    headers,
    body: credentials,
  });
  return { cookie: login.headers.get("set-cookie")?.split(";")[0] ?? "" };
}

function createToken(app: ReturnType<typeof createApp>, cookie: string, name: string) {
  return app.request("/v1/me/tokens", {
    method: "POST",
    headers: { ...headers, cookie },
    body: JSON.stringify({ name }),
  });
}

describe("personal API tokens", () => {
  it("creates a named token, shows the secret once, and stores only a hash", async () => {
    const { app, client } = setup();
    const { cookie } = await signIn(app, "owner@example.com");

    const created = await createToken(app, cookie, "CLI on laptop");
    expect(created.status).toBe(201);
    const body = (await created.json()) as { id: string; name: string; secret: string };
    expect(body.name).toBe("CLI on laptop");
    expect(body.secret.length).toBeGreaterThan(30);

    const stored = JSON.stringify(client.prepare("SELECT * FROM api_tokens").all());
    expect(stored).not.toContain(body.secret);

    const list = await app.request("/v1/me/tokens", { headers: { cookie } });
    const listed = (await list.json()) as { items: Array<Record<string, unknown>> };
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]).toMatchObject({ id: body.id, name: "CLI on laptop", revoked: false });
    expect(JSON.stringify(listed)).not.toContain(body.secret);
  });

  it("authenticates with the bearer token without cookies until it is revoked", async () => {
    const { app } = setup();
    const { cookie } = await signIn(app, "owner@example.com");
    const created = (await (await createToken(app, cookie, "ci")).json()) as {
      id: string;
      secret: string;
    };

    const profile = await app.request("/v1/profile", {
      headers: { authorization: `Bearer ${created.secret}` },
    });
    expect(profile.status).toBe(200);
    expect(await profile.json()).toMatchObject({ email: "owner@example.com" });

    const revoked = await app.request(`/v1/me/tokens/${created.id}`, {
      method: "DELETE",
      headers: { ...headers, cookie },
    });
    expect(revoked.status).toBe(204);

    const afterRevoke = await app.request("/v1/profile", {
      headers: { authorization: `Bearer ${created.secret}` },
    });
    expect(afterRevoke.status).toBe(401);
    expect(await afterRevoke.json()).toMatchObject({ error: { code: "token_revoked" } });

    const invalid = await app.request("/v1/profile", {
      headers: { authorization: "Bearer nope" },
    });
    expect(invalid.status).toBe(401);
    expect(await invalid.json()).toMatchObject({ error: { code: "invalid_api_token" } });
  });

  it("rejects unauthenticated, bearer-managed, and cross-user token access", async () => {
    const { app } = setup();
    const owner = await signIn(app, "owner@example.com");
    const other = await signIn(app, "other@example.com");
    const created = (await (await createToken(app, owner.cookie, "mine")).json()) as {
      id: string;
      secret: string;
    };

    expect((await app.request("/v1/me/tokens")).status).toBe(401);
    expect(
      (
        await app.request("/v1/me/tokens", {
          headers: { authorization: `Bearer ${created.secret}` },
        })
      ).status,
    ).toBe(401);

    const otherList = await app.request("/v1/me/tokens", { headers: { cookie: other.cookie } });
    expect(await otherList.json()).toEqual({ items: [] });

    const crossRevoke = await app.request(`/v1/me/tokens/${created.id}`, {
      method: "DELETE",
      headers: { ...headers, cookie: other.cookie },
    });
    expect(crossRevoke.status).toBe(404);
    expect(await crossRevoke.json()).toMatchObject({ error: { code: "token_not_found" } });

    const stillValid = await app.request("/v1/profile", {
      headers: { authorization: `Bearer ${created.secret}` },
    });
    expect(stillValid.status).toBe(200);

    const invalidName = await createToken(app, owner.cookie, "   ");
    expect(invalidName.status).toBe(400);
  });
});
