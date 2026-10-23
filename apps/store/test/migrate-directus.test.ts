import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { bytesToHex } from "@noble/hashes/utils.js";
import { decode, generateHash, verifySignature } from "@deconz-community/ddf-bundler";
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

async function legacy(options?: {
  tamperSignature?: boolean;
  tamperBundleId?: boolean;
}): Promise<LegacyFixture> {
  return createLegacyDatabase(resolve(directory, "directus.db"), options);
}

describe("migrateDirectus", () => {
  it("copies users and bundles into the fresh store and reports row counts", async () => {
    const source = await legacy();
    const { client, database } = freshTarget();

    const report = await migrateDirectus({
      sourcePath: source.path,
      database,
      publicUrl: "https://store.example/",
    });

    expect(report.tables).toEqual([
      { table: "users", source: 2, migrated: 2 },
      { table: "ddf_uuids", source: 1, migrated: 1 },
      { table: "bundles", source: 1, migrated: 1 },
      { table: "device_identifiers", source: 1, migrated: 1 },
      { table: "bundles_device_identifiers", source: 1, migrated: 1 },
      { table: "signatures", source: 1, migrated: 1 },
    ]);
    expect(report.bundlesVerified).toBe(1);
    expect(client.prepare("SELECT created_at FROM users WHERE id = ?").get(source.userId)).toEqual({
      created_at: Date.parse("2019-05-06T07:08:09.000Z"),
    });

    const app = createApp(database, { allowedOrigins: [origin] });
    const login = await app.request("/v1/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "ada@example.com", password: legacyPassword }),
    });
    expect(login.status).toBe(200);
    const profile = await app.request("/v1/me", {
      headers: { cookie: login.headers.get("set-cookie")?.split(";")[0] ?? "" },
    });
    expect(await profile.json()).toMatchObject({
      id: source.userId,
      username: "Ada Lovelace",
      avatar_url: "https://store.example/assets/22222222-2222-4222-8222-222222222222",
      public_key: contributorPublicKey,
      is_contributor: true,
      date_created: "2019-05-06T07:08:09.000Z",
    });

    const download = await app.request(`/v1/bundles/${source.bundleId}/download`);
    expect(download.status).toBe(200);
    expect(new Uint8Array(await download.arrayBuffer())).toEqual(source.bundleBytes);
  });

  it("does not import system keypairs, static tokens or Directus-only tables", async () => {
    const source = await legacy();
    const { client, database } = freshTarget();

    await migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" });

    expect(client.prepare("SELECT name FROM sqlite_master WHERE name = 'settings'").get()).toBe(
      undefined,
    );
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

  it("regenerates bundle signatures from their known public keys", async () => {
    const source = await legacy({ tamperSignature: true });
    const { client, database } = freshTarget();

    await migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" });

    const migrated = client.prepare("SELECT content, content_hash FROM bundles").get() as {
      content: Buffer;
      content_hash: string;
    };
    expect(createHash("sha256").update(migrated.content).digest("hex")).toBe(migrated.content_hash);
    const decoded = await decode(new Blob([new Uint8Array(migrated.content)]));
    expect(decoded.data.signatures).toHaveLength(1);
    expect(
      await verifySignature(
        decoded.data.hash!,
        decoded.data.signatures[0]!.key,
        decoded.data.signatures[0]!.signature,
      ),
    ).toBe(true);
  });

  it("replaces an incorrect bundle id with its content hash and updates references", async () => {
    const source = await legacy({ tamperBundleId: true });
    const { client, database } = freshTarget();

    await migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" });

    const migratedId = client.prepare("SELECT id FROM bundles").get() as { id: string };
    const decoded = await decode(new Blob([new Uint8Array(source.bundleBytes)]));
    expect(migratedId.id).toBe(bytesToHex(await generateHash(decoded.data)));
    expect(migratedId.id).not.toBe(source.bundleId);
    expect(client.prepare("SELECT bundle FROM signatures").get()).toEqual({
      bundle: migratedId.id,
    });
    expect(client.prepare("SELECT bundles_id FROM bundles_device_identifiers").get()).toEqual({
      bundles_id: migratedId.id,
    });
  });

  it("never modifies the source database", async () => {
    const source = await legacy();
    const before = statSync(source.path).mtimeMs;
    const { database } = freshTarget();

    await migrateDirectus({ sourcePath: source.path, database, publicUrl: "https://s.example" });

    expect(statSync(source.path).mtimeMs).toBe(before);
  });
});
