import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createSignature, decode, encode, sign } from "../../../packages/bundler/index.js";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/database.js";
import * as schema from "../src/schema.js";

const timestamp = Date.parse("2026-01-01T00:00:00.000Z");
const origin = "https://toolbox.example";
const fixture = readFileSync(
  resolve(import.meta.dirname, "../../../packages/bundler/test/ddb/starkvind_air_purifier.ddb"),
);
const clients: Array<{ close(): void }> = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

function setup(options: Parameters<typeof createApp>[1] = {}) {
  const client = new Database(":memory:");
  clients.push(client);
  const database = drizzle(client, { schema });
  runMigrations(database);
  const app = createApp(database, { allowedOrigins: [origin], now: () => timestamp, ...options });
  function addAuthor(id: string, isContributor = false) {
    const privateKey = new Uint8Array(32).fill(
      id === "owner" ? 7 : id === "other" ? 8 : id === "contributor" ? 9 : 10,
    );
    const publicKey = bytesToHex(secp256k1.getPublicKey(privateKey));
    const secret = `store-token-${id}`;
    database
      .insert(schema.users)
      .values({
        id,
        email: `${id}@example.com`,
        passwordHash: "unused",
        publicKey,
        privateKey: bytesToHex(privateKey),
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
        tokenHash: awaitHash(secret),
        tokenPrefix: secret.slice(0, 8),
        createdAt: timestamp,
      })
      .run();
    return { authorization: `Bearer ${secret}`, id, privateKey };
  }

  return { app, client, database, addAuthor };
}

function awaitHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function signedBundle(
  uuid: string,
  privateKey = new Uint8Array(32).fill(7),
  product?: string,
) {
  const bundle = await decode(new Blob([fixture]));
  const ddfc = bundle.data.files.find((file) => file.type === "DDFC");
  if (!ddfc) throw new Error("Fixture has no DDFC file");
  const ddfcData = JSON.parse(ddfc.data);
  ddfcData.uuid = uuid;
  if (product) ddfcData.product = product;
  ddfc.data = JSON.stringify(ddfcData, null, 2);
  bundle.generateDESC();
  return sign(encode(bundle), [{ key: privateKey }]);
}

async function bundleMissingDescriptorField(field: "uuid" | "version_deconz") {
  const bundle = await decode(new Blob([fixture]));
  const ddfc = bundle.data.files.find((file) => file.type === "DDFC");
  if (!ddfc) throw new Error("Fixture has no DDFC file");
  const ddfcData = JSON.parse(ddfc.data);
  delete ddfcData[field];
  ddfc.data = JSON.stringify(ddfcData, null, 2);
  bundle.data.desc[field] = "";
  bundle.data.signatures = [];
  bundle.generateDESC();
  return sign(encode(bundle), [{ key: new Uint8Array(32).fill(7) }]);
}

function formFor(...files: Array<[string, Blob]>) {
  const form = new FormData();
  for (const [name, file] of files) form.append("files", file, name);
  return form;
}

async function upload(
  app: ReturnType<typeof createApp>,
  authorization: string,
  form: FormData,
  state?: string,
) {
  return app.request(`/v1/bundles${state ? `?state=${encodeURIComponent(state)}` : ""}`, {
    method: "POST",
    headers: { authorization },
    body: form,
  });
}

describe("POST /v1/bundles", () => {
  it("validates, signs and stores real bundles as downloadable bytes", async () => {
    const { app, client, addAuthor } = setup();
    const author = addAuthor("owner");
    const input = await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c");

    const response = await upload(app, author.authorization, formFor(["starkvind.ddb", input]));

    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      results: Array<{ file: string; success: boolean; id?: string }>;
    };
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ file: "starkvind.ddb", success: true });
    expect(
      client
        .prepare("SELECT owner_id, expire_at FROM ddf_uuids WHERE id = ?")
        .get("f4c00c4c-2a92-489e-a930-7befe9b6484c"),
    ).toEqual({ owner_id: author.id, expire_at: null });
    expect(result.results[0]?.id).toBeDefined();
    const downloaded = await app.request(`/v1/bundles/${result.results[0]?.id}/download`);
    expect(downloaded.status).toBe(200);
    const storedBytes = new Uint8Array(await downloaded.arrayBuffer());
    expect(storedBytes).toEqual(new Uint8Array(await input.arrayBuffer()));
    const stored = await decode(new Blob([storedBytes]));
    expect(stored.data.signatures.map((signature) => bytesToHex(signature.key))).toContain(
      authorKey(),
    );
  });

  it("reports independent success and failure for multipart files", async () => {
    const { app, addAuthor } = setup();
    const author = addAuthor("owner");
    const valid = await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c");

    const response = await upload(
      app,
      author.authorization,
      formFor(["valid.ddb", valid], ["invalid.ddb", new Blob(["not a DDB"])]),
    );

    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      results: Array<{ file: string; success: boolean; error?: { code: string } }>;
    };
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ file: "valid.ddb", success: true });
    expect(result.results[1]).toMatchObject({
      file: "invalid.ddb",
      success: false,
      error: { code: "invalid_bundle" },
    });
  });

  it("reads upload state from the query instead of multipart fields", async () => {
    const { app, addAuthor } = setup();
    const author = addAuthor("owner");
    const form = formFor([
      "starkvind.ddb",
      await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c"),
    ]);
    form.set("state", "beta");

    const response = await upload(app, author.authorization, form);

    expect((await response.json()).results[0]).toMatchObject({
      file: "starkvind.ddb",
      success: true,
    });
  });

  it("rejects bundles whose regenerated DESC differs from their signed hash", async () => {
    const { app, addAuthor } = setup();
    const author = addAuthor("owner");
    const bundle = await decode(await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c"));
    const ddfc = bundle.data.files.find((file) => file.type === "DDFC")!;
    const ddfcData = JSON.parse(ddfc.data);
    ddfcData.vendor = "Changed after signing";
    ddfc.data = JSON.stringify(ddfcData, null, 2);

    const response = await upload(
      app,
      author.authorization,
      formFor(["changed.ddb", encode(bundle)]),
    );

    expect((await response.json()).results[0]).toMatchObject({
      success: false,
      error: { code: "invalid_desc" },
    });
  });

  it.each([
    ["uuid", "missing_uuid"],
    ["version_deconz", "missing_version_deconz"],
  ] as const)("requires the generated DESC %s field", async (field, code) => {
    const { app, addAuthor } = setup();
    const author = addAuthor("owner");

    const response = await upload(
      app,
      author.authorization,
      formFor(["missing.ddb", await bundleMissingDescriptorField(field)]),
    );

    expect((await response.json()).results[0]).toMatchObject({
      success: false,
      error: { code },
    });
  });

  it("rejects an invalid uploader signature", async () => {
    const { app, addAuthor } = setup();
    const author = addAuthor("owner");
    const bundle = await decode(await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c"));
    bundle.data.signatures[0]!.signature[0]! ^= 1;

    const response = await upload(
      app,
      author.authorization,
      formFor(["tampered.ddb", encode(bundle)]),
    );

    expect((await response.json()).results[0]).toMatchObject({
      success: false,
      error: { code: "invalid_signature" },
    });
  });

  it("rejects a profile whose public and private signing keys do not match", async () => {
    const { app, database, addAuthor } = setup();
    const author = addAuthor("owner");
    database
      .update(schema.users)
      .set({ privateKey: bytesToHex(new Uint8Array(32).fill(21)) })
      .where(eq(schema.users.id, author.id))
      .run();

    const response = await upload(
      app,
      author.authorization,
      formFor([
        "mismatched.ddb",
        await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c", author.privateKey),
      ]),
    );

    expect((await response.json()).results[0]).toMatchObject({
      success: false,
      error: { code: "uploader_keypair_mismatch" },
    });
  });

  it("rejects uploads to another author's UUID but allows contributors to update it", async () => {
    const { app, addAuthor } = setup();
    const owner = addAuthor("owner");
    const other = addAuthor("other");
    const contributor = addAuthor("contributor", true);
    const uuid = "f4c00c4c-2a92-489e-a930-7befe9b6484c";

    const first = await upload(
      app,
      owner.authorization,
      formFor(["first.ddb", await signedBundle(uuid, owner.privateKey)]),
    );
    expect((await first.json()).results[0].success).toBe(true);

    const forbidden = await upload(
      app,
      other.authorization,
      formFor(["second.ddb", await signedBundle(uuid, other.privateKey)]),
    );
    expect((await forbidden.json()).results[0]).toMatchObject({
      success: false,
      error: { code: "uuid_forbidden" },
    });

    const allowed = await upload(
      app,
      contributor.authorization,
      formFor([
        "third.ddb",
        await signedBundle(uuid, contributor.privateKey, "Contributor update"),
      ]),
    );
    expect((await allowed.json()).results[0].success).toBe(true);
  });

  it("rejects duplicate bundle hashes with a typed per-file error", async () => {
    const { app, addAuthor } = setup();
    const author = addAuthor("owner");
    const bundle = await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c");

    await upload(app, author.authorization, formFor(["first.ddb", bundle]));
    const duplicate = await upload(app, author.authorization, formFor(["duplicate.ddb", bundle]));

    expect((await duplicate.json()).results[0]).toMatchObject({
      success: false,
      error: { code: "bundle_hash_already_exists" },
    });
  });

  it.each(["beta", "stable"] as const)(
    "restricts %s system signing to contributors",
    async (state) => {
      const { app, addAuthor } = setup();
      const author = addAuthor("owner");

      const response = await upload(
        app,
        author.authorization,
        formFor(["starkvind.ddb", await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c")]),
        state,
      );

      expect((await response.json()).results[0]).toMatchObject({
        success: false,
        error: { code: "contributor_required" },
      });
    },
  );

  it("adds a verified system signature for a contributor's beta upload", async () => {
    const systemPrivateKey = new Uint8Array(32).fill(11);
    const systemPublicKey = bytesToHex(secp256k1.getPublicKey(systemPrivateKey));
    const { app, addAuthor } = setup({
      systemSigningKeys: {
        beta: { privateKey: bytesToHex(systemPrivateKey), publicKey: systemPublicKey },
      },
    });
    const contributor = addAuthor("contributor", true);
    const response = await upload(
      app,
      contributor.authorization,
      formFor([
        "starkvind.ddb",
        await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c", contributor.privateKey),
      ]),
      "beta",
    );
    const result = (await response.json()).results[0];

    expect(result.success).toBe(true);
    const stored = await app.request(`/v1/bundles/${result.id}/download`);
    const bundle = await decode(new Blob([await stored.arrayBuffer()]));
    expect(bundle.data.signatures.map((signature) => bytesToHex(signature.key))).toContain(
      systemPublicKey,
    );
    const search = await app.request(`/v1/bundles?has_key=${systemPublicKey}`);
    expect((await search.json()).items[0].signatures).toContainEqual({
      key: systemPublicKey,
      type: "system",
    });
  });

  it("keeps deprecated signatures classified as system signatures on upload", async () => {
    const deprecatedPrivateKey = new Uint8Array(32).fill(13);
    const deprecatedPublicKey = bytesToHex(secp256k1.getPublicKey(deprecatedPrivateKey));
    const { app, addAuthor } = setup({
      systemSigningKeys: {
        deprecated: {
          privateKey: bytesToHex(deprecatedPrivateKey),
          publicKey: deprecatedPublicKey,
        },
      },
    });
    const author = addAuthor("owner");
    const bundle = await decode(
      await signedBundle("f4c00c4c-2a92-489e-a930-7befe9b6484c", author.privateKey),
    );
    bundle.data.signatures.push({
      key: secp256k1.getPublicKey(deprecatedPrivateKey),
      signature: createSignature(bundle.data.hash!, deprecatedPrivateKey),
    });

    const response = await upload(
      app,
      author.authorization,
      formFor(["deprecated.ddb", encode(bundle)]),
    );

    expect((await response.json()).results[0].success).toBe(true);
    const search = await app.request(`/v1/bundles?has_key=${deprecatedPublicKey}`);
    expect((await search.json()).items[0].signatures).toContainEqual({
      key: deprecatedPublicKey,
      type: "system",
    });
  });
});

function authorKey() {
  return bytesToHex(secp256k1.getPublicKey(new Uint8Array(32).fill(7)));
}
