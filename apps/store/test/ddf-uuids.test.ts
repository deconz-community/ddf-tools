import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/database.js";
import * as schema from "../src/schema.js";

const timestamp = Date.parse("2026-01-01T00:00:00.000Z");
const origin = "https://toolbox.example";
const clients: Array<{ close(): void }> = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

function setup() {
  const client = new Database(":memory:");
  clients.push(client);
  const database = drizzle(client, { schema });
  runMigrations(database);
  const app = createApp(database, { allowedOrigins: [origin], now: () => timestamp });
  const userId = "author-1";
  const secret = "store-test-token";
  const tokenHash = createHash("sha256").update(secret).digest("hex");
  database
    .insert(schema.users)
    .values({
      id: userId,
      email: "author@example.com",
      passwordHash: "unused",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
  database
    .insert(schema.apiTokens)
    .values({
      id: "token-1",
      userId,
      name: "tests",
      tokenHash,
      tokenPrefix: "store-te",
      createdAt: timestamp,
    })
    .run();
  return { app, client, userId, authorization: `Bearer ${secret}` };
}

describe("POST /v1/ddf-uuids", () => {
  it("creates between one and one hundred UUIDs owned by the author for three weeks", async () => {
    const { app, client, userId, authorization } = setup();

    const response = await app.request("/v1/ddf-uuids", {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ count: 2 }),
    });

    expect(response.status).toBe(201);
    const result = (await response.json()) as { uuids: string[]; expire_at: string };
    expect(result.uuids).toHaveLength(2);
    expect(new Set(result.uuids).size).toBe(2);
    expect(result.expire_at).toBe("2026-01-22T00:00:00.000Z");
    const rows = client
      .prepare("SELECT id, owner_id, expire_at FROM ddf_uuids ORDER BY id")
      .all() as Array<{ id: string; owner_id: string; expire_at: string }>;
    expect(rows.map((row) => row.id).sort()).toEqual([...result.uuids].sort());
    expect(rows.every((row) => row.owner_id === userId && row.expire_at === result.expire_at)).toBe(
      true,
    );
  });

  it.each([1, 100])("accepts the inclusive UUID count boundary %s", async (count) => {
    const { app, authorization } = setup();

    const response = await app.request("/v1/ddf-uuids", {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ count }),
    });

    expect(response.status).toBe(201);
    expect((await response.json()).uuids).toHaveLength(count);
  });

  it.each([0, 101, 1.5, "2"])("rejects an invalid UUID count: %s", async (count) => {
    const { app, authorization } = setup();

    const response = await app.request("/v1/ddf-uuids", {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ count }),
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: "validation_error" },
    });
  });

  it("requires authentication", async () => {
    const { app } = setup();

    const response = await app.request("/v1/ddf-uuids", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
        "x-store-request": "1",
      },
      body: JSON.stringify({ count: 1 }),
    });

    expect(response.status).toBe(401);
  });
});
