import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { createApp } from "../src/app.js";
import { runCli } from "../src/cli.js";
import * as schema from "../src/schema.js";
import { createLegacyDatabase } from "./legacy-directus.js";

const origin = "https://toolbox.example";
let directory: string;
let databasePath: string;

beforeEach(() => {
  directory = mkdtempSync(resolve(import.meta.dirname, ".tmp-"));
  databasePath = resolve(directory, "store.db");
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

async function cli(args: string[], env: Record<string, string> = {}) {
  const lines: string[] = [];
  const code = await runCli(args, { DATABASE_PATH: databasePath, ...env }, (line) =>
    lines.push(line),
  );
  return { code, output: lines.join("\n") };
}

function query<T>(sql: string, ...params: unknown[]): T[] {
  const client = new Database(databasePath, { readonly: true });
  try {
    return client.prepare(sql).all(...params) as T[];
  } finally {
    client.close();
  }
}

describe("store operations CLI", () => {
  it("empties the database only when confirmed", async () => {
    await cli(["user:create", "a@example.com"], { STORE_USER_PASSWORD: "a secure password" });

    const refused = await cli(["db:reset"]);
    expect(refused.code).toBe(1);
    expect(query("SELECT id FROM users")).toHaveLength(1);

    const result = await cli(["db:reset", "--yes"]);
    expect(result.code).toBe(0);
    expect(query("SELECT id FROM users")).toHaveLength(0);
  });

  it("creates a user who can log in, with a consistent key pair", async () => {
    const result = await cli(["user:create", "Admin@Example.com"], {
      STORE_USER_PASSWORD: "a secure password",
    });
    expect(result.code).toBe(0);

    const [user] = query<{ public_key: string; private_key: string; is_contributor: number }>(
      "SELECT public_key, private_key, is_contributor FROM users WHERE email = 'admin@example.com'",
    );
    expect(bytesToHex(secp256k1.getPublicKey(hexToBytes(user!.private_key)))).toBe(
      user!.public_key,
    );
    expect(user!.is_contributor).toBe(0);

    const client = new Database(databasePath);
    const app = createApp(drizzle(client, { schema }), { allowedOrigins: [origin] });
    const login = await app.request("/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin, "x-store-request": "1" },
      body: JSON.stringify({ email: "admin@example.com", password: "a secure password" }),
    });
    client.close();
    expect(login.status).toBe(200);
  });

  it("rejects a duplicate user or a missing password", async () => {
    expect((await cli(["user:create", "a@example.com"])).code).toBe(1);
    const env = { STORE_USER_PASSWORD: "a secure password" };
    expect((await cli(["user:create", "a@example.com"], env)).code).toBe(0);
    expect((await cli(["user:create", "a@example.com"], env)).code).toBe(1);
  });

  it("assigns and revokes the contributor role", async () => {
    await cli(["user:create", "a@example.com"], { STORE_USER_PASSWORD: "a secure password" });

    expect((await cli(["user:contributor", "a@example.com"])).code).toBe(0);
    expect(query("SELECT is_contributor FROM users")).toEqual([{ is_contributor: 1 }]);
    expect((await cli(["user:contributor", "a@example.com", "--revoke"])).code).toBe(0);
    expect(query("SELECT is_contributor FROM users")).toEqual([{ is_contributor: 0 }]);
    expect((await cli(["user:contributor", "missing@example.com"])).code).toBe(1);
  });

  it("generates a system key whose public key matches the private key", async () => {
    const result = await cli(["system-key:generate", "beta"]);

    expect(result.code).toBe(0);
    const privateKey = /^BETA_PRIVATE_KEY=([\da-f]{64})$/m.exec(result.output)?.[1];
    const publicKey = /^public key: ([\da-f]{66})$/m.exec(result.output)?.[1];
    expect(bytesToHex(secp256k1.getPublicKey(hexToBytes(privateKey!)))).toBe(publicKey);
    expect((await cli(["system-key:generate", "alpha"])).code).toBe(1);
  });

  it("migrates a Directus database and prints row counts", async () => {
    const source = await createLegacyDatabase(resolve(directory, "directus.db"));

    const result = await cli(["migrate:directus", source.path], {
      PUBLIC_URL: "https://store.example",
    });

    expect(result.code).toBe(0);
    expect(result.output).toContain("bundles: 1 of 1");
    expect(result.output).toContain("1 bundle(s) verified");
    expect(query("SELECT count(*) AS n FROM users")).toEqual([{ n: 2 }]);

    const again = await cli(["migrate:directus", source.path], {
      PUBLIC_URL: "https://store.example",
    });
    expect(again.code).toBe(1);
    expect(again.output).toMatch(/not empty/);
  });

  it("reports usage for unknown commands", async () => {
    const result = await cli(["nope"]);
    expect(result.code).toBe(1);
    expect(result.output).toMatch(/Usage/);
  });
});
