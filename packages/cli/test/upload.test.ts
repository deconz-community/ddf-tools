import { createHash, createECDH } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "@commander-js/extra-typings";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { decode, encode, sign } from "../../bundler/index.js";
import { createTestStore } from "../../../apps/store/test/support.js";
import * as schema from "../../../apps/store/src/schema.js";
import { registerUploadCommands } from "../src/upload.js";

const stores: Array<ReturnType<typeof createTestStore>> = [];
const fixture = resolve(import.meta.dirname, "../../bundler/test/ddb/starkvind_air_purifier.ddb");

afterEach(() => {
  for (const store of stores.splice(0)) store.client.close();
});

function setup() {
  const store = createTestStore();
  stores.push(store);
  const privateKey = Buffer.alloc(32, 7);
  const ecdh = createECDH("secp256k1");
  ecdh.setPrivateKey(privateKey);
  const publicKey = ecdh.getPublicKey("hex", "compressed");
  const secret = "cli-store-token";
  store.database
    .insert(schema.users)
    .values({
      id: "cli-author",
      email: "cli@example.com",
      passwordHash: "unused",
      publicKey,
      privateKey: privateKey.toString("hex"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();
  store.database
    .insert(schema.apiTokens)
    .values({
      id: "cli-token",
      userId: "cli-author",
      name: "CLI tests",
      tokenHash: createHash("sha256").update(secret).digest("hex"),
      tokenPrefix: secret.slice(0, 8),
      createdAt: Date.now(),
    })
    .run();
  return { store, secret, privateKey };
}

async function signedFixture(privateKey: Buffer) {
  const bundle = await decode(new Blob([await readFile(fixture)]));
  bundle.data.signatures = [];
  return sign(encode(bundle), [{ key: privateKey }]);
}

describe("CLI bundle upload", () => {
  it("uploads one bundle through an in-process store and reports its result", async () => {
    const { store, secret, privateKey } = setup();
    const lines: string[] = [];
    const command = new Command();
    const signed = await signedFixture(privateKey);
    registerUploadCommands(command, {
      fetch: (async (input, init) => store.app.fetch(new Request(input, init))) as typeof fetch,
      readFile: async () => new Uint8Array(await signed.arrayBuffer()),
      out: (line) => lines.push(line),
      error: (line) => lines.push(line),
    });

    await command.parseAsync(
      [
        "node",
        "test",
        "upload",
        fixture,
        "--store-url",
        "http://store.test",
        "--store-token",
        secret,
      ],
      { from: "node" },
    );

    expect(lines.join("\n")).toContain("starkvind_air_purifier.ddb uploaded successfully");
    expect(lines.join("\n")).toContain("(alpha)");
    expect(store.client.prepare("SELECT id FROM bundles").all()).toHaveLength(1);
  });

  it("supports bulk upload for a directory and reports each result", async () => {
    const { store, secret, privateKey } = setup();
    const lines: string[] = [];
    const command = new Command();
    const signed = await signedFixture(privateKey);
    registerUploadCommands(command, {
      fetch: (async (input, init) => store.app.fetch(new Request(input, init))) as typeof fetch,
      readFile: async () => new Uint8Array(await signed.arrayBuffer()),
      out: (line) => lines.push(line),
      error: (line) => lines.push(line),
    });

    await command.parseAsync(
      [
        "node",
        "test",
        "bulk",
        "upload",
        resolve(fixture, ".."),
        "--store-url",
        "http://store.test",
        "--store-token",
        secret,
        "--state",
        "alpha",
      ],
      { from: "node" },
    );

    expect(lines.join("\n")).toContain("starkvind_air_purifier.ddb uploaded successfully");
    expect(store.client.prepare("SELECT id FROM bundles").all()).toHaveLength(1);
  });
});
