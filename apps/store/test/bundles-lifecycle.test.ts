import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vite-plus/test";
import type { AccountOptions } from "../src/accounts.js";
import {
  createSignature,
  decode,
  encode,
  verifySignature,
} from "../../../packages/bundler/index.js";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/database.js";
import * as schema from "../src/schema.js";

const fixture = readFileSync(
  resolve(import.meta.dirname, "../../../packages/bundler/test/ddb/starkvind_air_purifier.ddb"),
);
const timestamp = Date.parse("2026-01-01T00:00:00.000Z");
const stores: Array<{ close(): void }> = [];

function setup(
  systemSigningKeys: AccountOptions["systemSigningKeys"] = {
    beta: {
      privateKey: bytesToHex(new Uint8Array(32).fill(11)),
      publicKey: bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(11))),
    },
    stable: {
      privateKey: bytesToHex(new Uint8Array(32).fill(12)),
      publicKey: bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(12))),
    },
    deprecated: {
      privateKey: bytesToHex(new Uint8Array(32).fill(13)),
      publicKey: bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
    },
  },
) {
  const client = new Database(":memory:");
  stores.push(client);
  client.pragma("foreign_keys = ON");
  const database = drizzle(client, { schema });
  runMigrations(database);
  const app = createApp(database, {
    allowedOrigins: ["https://toolbox.example"],
    now: () => timestamp,
    systemSigningKeys,
  });

  function addUser(id: string, isContributor = false) {
    const secret = `store-token-${id}`;
    database
      .insert(schema.users)
      .values({
        id,
        email: `${id}@example.com`,
        passwordHash: "unused",
        isContributor,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
    database
      .insert(schema.apiTokens)
      .values({
        id: `token-${id}`,
        userId: id,
        name: "tests",
        tokenHash: createHash("sha256").update(secret).digest("hex"),
        tokenPrefix: secret.slice(0, 8),
        createdAt: timestamp,
      })
      .run();
    return { authorization: `Bearer ${secret}` };
  }

  async function addBundle(ownerId: string) {
    const bundle = await decode(new Blob([fixture]));
    const id = bytesToHex(bundle.data.hash!);
    const ddfUuid = bundle.data.desc.uuid!;
    const ownerPrivateKey = new Uint8Array(32).fill(7);
    bundle.data.signatures = [
      {
        key: secp256k1.getPublicKey(ownerPrivateKey),
        signature: createSignature(bundle.data.hash!, ownerPrivateKey),
      },
    ];
    const content = Buffer.from(await encode(bundle).arrayBuffer());
    database
      .insert(schema.ddfUuids)
      .values({ id: ddfUuid, date_created: new Date(timestamp).toISOString(), owner_id: ownerId })
      .run();
    database
      .insert(schema.bundles)
      .values({
        id,
        ddf_uuid: ddfUuid,
        date_created: new Date(timestamp).toISOString(),
        source_last_modified: bundle.data.desc.last_modified.toISOString(),
        vendor: bundle.data.desc.vendor || "Unknown vendor",
        product: bundle.data.desc.product || "Unknown product",
        version_deconz: bundle.data.desc.version_deconz,
        info: null,
        content,
        content_size: content.length,
        file_count: bundle.data.files.length,
        content_hash: createHash("sha256").update(content).digest("hex"),
      })
      .run();
    database
      .insert(schema.signatures)
      .values({
        id: randomUUID(),
        bundle: id,
        key: bytesToHex(secp256k1.getPublicKey(ownerPrivateKey)),
        type: "user",
      })
      .run();
    return id;
  }

  return { app, client, database, addUser, addBundle };
}

afterEach(() => {
  for (const store of stores.splice(0)) store.close();
});

describe("bundle lifecycle endpoints", () => {
  it("returns authentication errors before parsing an unauthenticated lifecycle request", async () => {
    const { app } = setup();

    const response = await app.request("/v1/bundles/missing/signatures", {
      method: "POST",
      headers: {
        origin: "https://toolbox.example",
        "x-store-request": "1",
        "content-type": "application/json",
      },
      body: "invalid JSON",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "unauthenticated" } });
  });

  it("lets contributors sign a real bundle with the configured beta key", async () => {
    const { app, addUser, addBundle } = setup();
    const contributor = addUser("contributor", true);
    const bundleId = await addBundle("owner");

    const response = await app.request(`/v1/bundles/${bundleId}/signatures`, {
      method: "POST",
      headers: { ...contributor, "content-type": "application/json" },
      body: JSON.stringify({ state: "beta" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, state: "beta" });
    const downloaded = await app.request(`/v1/bundles/${bundleId}/download`);
    const signedBundle = await decode(new Blob([await downloaded.arrayBuffer()]));
    expect(signedBundle.data.signatures.map((signature) => bytesToHex(signature.key))).toContain(
      bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(7))),
    );
    const betaSignature = signedBundle.data.signatures.find(
      (signature) =>
        bytesToHex(signature.key) ===
        bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(11))),
    );
    expect(betaSignature).toBeDefined();
    expect(
      await verifySignature(signedBundle.data.hash!, betaSignature!.key, betaSignature!.signature),
    ).toBe(true);
  });

  it("restricts system signing to contributors and returns a typed error", async () => {
    const { app, addUser, addBundle } = setup();
    const owner = addUser("owner");
    const bundleId = await addBundle("owner");

    const response = await app.request(`/v1/bundles/${bundleId}/signatures`, {
      method: "POST",
      headers: { ...owner, "content-type": "application/json" },
      body: JSON.stringify({ state: "stable" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "contributor_required", message: expect.any(String) },
    });
  });

  it("rejects invalid signing states and missing bundles with typed errors", async () => {
    const { app, addUser } = setup();
    const contributor = addUser("contributor", true);
    const headers = { ...contributor, "content-type": "application/json" };

    const invalid = await app.request("/v1/bundles/missing/signatures", {
      method: "POST",
      headers,
      body: JSON.stringify({ state: "gamma" }),
    });
    const missing = await app.request("/v1/bundles/missing/signatures", {
      method: "POST",
      headers,
      body: JSON.stringify({ state: "beta" }),
    });

    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { code: "validation_error" } });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "bundle_not_found" } });
  });

  it("replaces system state signatures when promoting and returning to alpha", async () => {
    const { app, addUser, addBundle } = setup();
    const contributor = addUser("contributor", true);
    const bundleId = await addBundle("owner");
    const headers = { ...contributor, "content-type": "application/json" };
    const sign = (state: string) =>
      app.request(`/v1/bundles/${bundleId}/signatures`, {
        method: "POST",
        headers,
        body: JSON.stringify({ state }),
      });
    const stableKey = bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(12)));
    const betaKey = bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(11)));

    await sign("beta");
    const stable = await sign("stable");
    expect(stable.status).toBe(200);
    expect((await stable.json()).signatures).toContainEqual({ key: stableKey, type: "system" });
    expect((await (await app.request("/v1/bundles?has_key=" + betaKey)).json()).total_count).toBe(
      0,
    );

    const alpha = await sign("alpha");
    expect(alpha.status).toBe(200);
    const afterAlpha = await app.request(`/v1/bundles/${bundleId}/download`);
    const decoded = await decode(new Blob([await afterAlpha.arrayBuffer()]));
    expect(decoded.data.signatures.map((signature) => bytesToHex(signature.key))).not.toContain(
      stableKey,
    );
  });

  it("returns a typed signing failure when a system key is not configured", async () => {
    const { app, addUser, addBundle } = setup({});
    const contributor = addUser("contributor", true);
    const bundleId = await addBundle("owner");

    const response = await app.request(`/v1/bundles/${bundleId}/signatures`, {
      method: "POST",
      headers: { ...contributor, "content-type": "application/json" },
      body: JSON.stringify({ state: "stable" }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "system_signing_unavailable", message: expect.any(String) },
    });
  });

  it("adds and removes the system deprecated signature with an owner's message", async () => {
    const { app, addUser, addBundle } = setup();
    const owner = addUser("owner");
    const bundleId = await addBundle("owner");
    const headers = { ...owner, "content-type": "application/json" };

    const marked = await app.request(`/v1/bundles/${bundleId}/deprecate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "Replaced by a newer bundle." }),
    });
    expect(marked.status).toBe(200);
    expect(await marked.json()).toMatchObject({
      success: true,
      deprecation_message: "Replaced by a newer bundle.",
    });
    let bundle = await decode(
      new Blob([await (await app.request(`/v1/bundles/${bundleId}/download`)).arrayBuffer()]),
    );
    expect(bundle.data.signatures.map((signature) => bytesToHex(signature.key))).toContain(
      bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
    );
    const deprecatedKey = bundle.data.signatures.find(
      (signature) =>
        bytesToHex(signature.key) ===
        bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
    );
    expect(
      await verifySignature(bundle.data.hash!, deprecatedKey!.key, deprecatedKey!.signature),
    ).toBe(true);
    expect(
      (await (await app.request("/v1/bundles?show_deprecated=true")).json()).items[0].signatures,
    ).toContainEqual({
      key: bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
      type: "system",
    });

    const updated = await app.request(`/v1/bundles/${bundleId}/deprecate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "This version is no longer supported." }),
    });
    expect(updated.status).toBe(200);
    expect((await updated.json()).deprecation_message).toBe("This version is no longer supported.");
    bundle = await decode(
      new Blob([await (await app.request(`/v1/bundles/${bundleId}/download`)).arrayBuffer()]),
    );
    expect(
      bundle.data.signatures.filter(
        (signature) =>
          bytesToHex(signature.key) ===
          bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
      ),
    ).toHaveLength(1);

    const cleared = await app.request(`/v1/bundles/${bundleId}/deprecate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: null }),
    });
    expect(cleared.status).toBe(200);
    expect(await cleared.json()).toMatchObject({ deprecation_message: null });
    bundle = await decode(
      new Blob([await (await app.request(`/v1/bundles/${bundleId}/download`)).arrayBuffer()]),
    );
    expect(bundle.data.signatures.map((signature) => bytesToHex(signature.key))).not.toContain(
      bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
    );
    const activeBundle = (await (await app.request("/v1/bundles")).json()).items[0];
    expect(activeBundle.deprecation_message).toBeNull();
    expect(activeBundle.signatures).not.toContainEqual({
      key: bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(13))),
      type: "system",
    });
  });

  it("allows contributors but not other users to deprecate bundles", async () => {
    const { app, addUser, addBundle } = setup();
    const other = addUser("other");
    const contributor = addUser("contributor", true);
    const bundleId = await addBundle("owner");
    const headers = { "content-type": "application/json" };

    const forbidden = await app.request(`/v1/bundles/${bundleId}/deprecate`, {
      method: "POST",
      headers: { ...headers, ...other },
      body: JSON.stringify({ message: "This version is no longer supported." }),
    });
    const allowed = await app.request(`/v1/bundles/${bundleId}/deprecate`, {
      method: "POST",
      headers: { ...headers, ...contributor },
      body: JSON.stringify({ message: "This version is no longer supported." }),
    });

    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toMatchObject({ error: { code: "bundle_forbidden" } });
    expect(allowed.status).toBe(200);
  });

  it("rejects short messages and missing bundles with typed deprecation errors", async () => {
    const { app, addUser, addBundle } = setup();
    const owner = addUser("owner");
    const bundleId = await addBundle("owner");
    const headers = { ...owner, "content-type": "application/json" };

    const invalid = await app.request(`/v1/bundles/${bundleId}/deprecate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "Too short" }),
    });
    const missing = await app.request("/v1/bundles/missing/deprecate", {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "This version is no longer supported." }),
    });

    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { code: "invalid_deprecation_message" } });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "bundle_not_found" } });
  });
});
