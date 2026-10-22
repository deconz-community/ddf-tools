import Database from "better-sqlite3";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/database.js";
import { migrateDirectus } from "../src/migrate-directus.js";
import * as schema from "../src/schema.js";
import {
  contributorPublicKey,
  createLegacyDatabase,
  legacyPassword,
  type LegacyFixture,
} from "./legacy-directus.js";

const origin = "https://toolbox.example";
const headers = { "content-type": "application/json", origin, "x-store-request": "1" };
let directory: string;
const clients: Array<{ close(): void }> = [];

beforeEach(() => {
  directory = mkdtempSync(resolve(import.meta.dirname, ".tmp-"));
});

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
  rmSync(directory, { recursive: true, force: true });
});

function freshTarget() {
  const client = new Database(":memory:");
  clients.push(client);
  client.pragma("foreign_keys = ON");
  const database = drizzle(client, { schema });
  runMigrations(database);
  return { client, database };
}

async function legacy(options?: { tamperSignature?: boolean }): Promise<LegacyFixture> {
  return createLegacyDatabase(resolve(directory, "directus.db"), options);
}

describe("migrateDirectus", () => {
  it("copies users, settings and bundles into the fresh store and reports row counts", async () => {
    const source = await legacy();
    const { database } = freshTarget();

    const report = await migrateDirectus({
      sourcePath: source.path,
      database,
      publicUrl: "https://store.example/",
      now: () => Date.parse("2026-01-01T00:00:00.000Z"),
    });

    expect(report.tables).toEqual([
      { table: "users", source: 2, migrated: 2 },
      { table: "settings", source: 6, migrated: 6 },
      { table: "ddf_uuids", source: 1, migrated: 1 },
      { table: "bundles", source: 1, migrated: 1 },
      { table: "device_identifiers", source: 1, migrated: 1 },
      { table: "bundles_device_identifiers", source: 1, migrated: 1 },
      { table: "signatures", source: 1, migrated: 1 },
    ]);
    expect(report.bundlesVerified).toBe(1);

    const app = createApp(database, { allowedOrigins: [origin] });
    const login = await app.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "ada@example.com", password: legacyPassword }),
    });
    expect(login.status).toBe(200);
    const profile = await app.request("/v1/profile", {
      headers: { cookie: login.headers.get("set-cookie")?.split(";")[0] ?? "" },
    });
    expect(await profile.json()).toMatchObject({
      id: source.userId,
      first_name: "Ada",
      avatar_url: "https://store.example/assets/22222222-2222-4222-8222-222222222222",
      public_key: contributorPublicKey,
      is_contributor: true,
    });

    const download = await app.request(`/v1/bundles/${source.bundleId}/download`);
    expect(download.status).toBe(200);
    expect(new Uint8Array(await download.arrayBuffer())).toEqual(source.bundleBytes);
  });

  it("preserves all system keypairs but not static tokens or Directus-only tables", async () => {
    const source = await legacy();
    const { client, database } = freshTarget();

    await migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" });

    const settings = Object.fromEntries(
      (client.prepare("SELECT key, value FROM settings").all() as Array<{ key: string; value: string }>).map(
        ({ key, value }) => [key, value],
      ),
    );
    expect(settings).toEqual({
      public_key_stable: source.systemKeys.stable.publicKey,
      private_key_stable: source.systemKeys.stable.privateKey,
      public_key_beta: source.systemKeys.beta.publicKey,
      private_key_beta: source.systemKeys.beta.privateKey,
      public_key_deprecated: source.systemKeys.deprecated.publicKey,
      private_key_deprecated: source.systemKeys.deprecated.privateKey,
    });
    expect(JSON.stringify(client.prepare("SELECT * FROM users").all())).not.toContain(
      "static-token",
    );
    expect(client.prepare("SELECT count(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("refuses a non-empty target and leaves it untouched", async () => {
    const source = await legacy();
    const { client, database } = freshTarget();
    client
      .prepare(
        "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ('x','x@example.com','h',1,1)",
      )
      .run();

    await expect(
      migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" }),
    ).rejects.toThrow(/not empty/);
    expect(client.prepare("SELECT count(*) AS n FROM bundles").get()).toEqual({ n: 0 });
  });

  it("rolls everything back when a bundle signature does not verify", async () => {
    const source = await legacy({ tamperSignature: true });
    const { client, database } = freshTarget();

    await expect(
      migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" }),
    ).rejects.toThrow(/bundle/i);
    expect(client.prepare("SELECT count(*) AS n FROM users").get()).toEqual({ n: 0 });
  });

  it("never modifies the source database", async () => {
    const source = await legacy();
    const before = statSync(source.path).mtimeMs;
    const { database } = freshTarget();

    await migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" });

    expect(statSync(source.path).mtimeMs).toBe(before);
  });
});
