import Database from "better-sqlite3";
import argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { decode, encode, generateHash, sign } from "../../../packages/bundler/index.js";

const fixture = readFileSync(
  resolve(import.meta.dirname, "../../../packages/bundler/test/ddb/starkvind_air_purifier.ddb"),
);

export const legacyPassword = "legacy anonymous password";
export const contributorKey = new Uint8Array(32).fill(21);
export const contributorPublicKey = bytesToHex(secp256k1.getPublicKey(contributorKey));

export async function signedBundle(uuid: string, privateKey = contributorKey): Promise<Uint8Array> {
  const bundle = await decode(new Blob([fixture]));
  const ddfc = bundle.data.files.find((file) => file.type === "DDFC");
  if (!ddfc) throw new Error("Fixture has no DDFC file");
  ddfc.data = JSON.stringify({ ...JSON.parse(ddfc.data), uuid }, null, 2);
  bundle.generateDESC();
  const signed = await sign(encode(bundle), [{ key: privateKey }]);
  return new Uint8Array(await signed.arrayBuffer());
}

export interface LegacyFixture {
  path: string;
  bundleId: string;
  bundleBytes: Uint8Array;
  userId: string;
  uuid: string;
  systemKeys: Record<"stable" | "beta" | "deprecated", { publicKey: string; privateKey: string }>;
}

// Builds an anonymized database shaped like the Directus-managed SQLite store.
export async function createLegacyDatabase(
  path: string,
  options: { tamperSignature?: boolean } = {},
): Promise<LegacyFixture> {
  const uuid = "f4c00c4c-2a92-489e-a930-7befe9b6484c";
  const userId = "11111111-1111-4111-8111-111111111111";
  const bundleBytes = await signedBundle(uuid);
  const decoded = await decode(new Blob([bundleBytes as Uint8Array<ArrayBuffer>]));
  const bundleId = bytesToHex(await generateHash(decoded.data));
  const stored = options.tamperSignature
    ? Uint8Array.from(bundleBytes, (byte, index) =>
        index === bundleBytes.length - 3 ? byte ^ 1 : byte,
      )
    : bundleBytes;
  const content = Buffer.from(deflateSync(stored)).toString("base64");
  const passwordHash = await argon2.hash(legacyPassword, { type: argon2.argon2id });

  const db = new Database(path);
  db.exec(`
    CREATE TABLE directus_users (id char(36) PRIMARY KEY, first_name varchar(50), last_name varchar(50),
      email varchar(128) UNIQUE, password varchar(255), avatar char(36), status varchar(16),
      token varchar(255), public_key varchar(255), private_key varchar(255), is_contributor boolean DEFAULT 0);
    CREATE TABLE directus_files (id char(36) PRIMARY KEY, filename_download varchar(255));
    CREATE TABLE directus_settings (id integer PRIMARY KEY, project_name varchar(100),
      public_key_stable varchar(255), private_key_stable varchar(255), public_key_beta varchar(255),
      private_key_beta varchar(255), public_key_deprecated varchar(255), private_key_deprecated varchar(255));
    CREATE TABLE directus_sessions (token varchar(64) PRIMARY KEY);
    CREATE TABLE ddf_uuids (id char(36) PRIMARY KEY, user_created char(36), date_created datetime, expire_at datetime);
    CREATE TABLE bundles (id char(64) PRIMARY KEY, user_created char(36), date_created datetime, ddf_uuid char(36),
      source_last_modified datetime, vendor varchar(255), product varchar(255), version_deconz varchar(255),
      info varchar(255), content text, content_size integer, file_count integer, content_hash varchar(255),
      deprecation_message varchar(255));
    CREATE TABLE device_identifiers (id char(36) PRIMARY KEY, manufacturer varchar(255), model varchar(255));
    CREATE TABLE bundles_device_identifiers (id integer PRIMARY KEY, bundles_id char(64), device_identifiers_id char(36));
    CREATE TABLE signatures (id char(36) PRIMARY KEY, key varchar(255), bundle varchar(255), type varchar(255));
    CREATE TABLE sub_devices (id char(36) PRIMARY KEY, name varchar(255));
    CREATE TABLE bundles_sub_devices (id integer PRIMARY KEY, bundles_id char(64), sub_devices_id char(36));
  `);
  const systemKeys = Object.fromEntries(
    (["stable", "beta", "deprecated"] as const).map((name, index) => {
      const privateKey = new Uint8Array(32).fill(31 + index);
      return [
        name,
        {
          publicKey: bytesToHex(secp256k1.getPublicKey(privateKey)),
          privateKey: bytesToHex(privateKey),
        },
      ];
    }),
  ) as LegacyFixture["systemKeys"];
  db.prepare("INSERT INTO directus_users VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
    userId,
    "Ada",
    "Example",
    "Ada@Example.com",
    passwordHash,
    "22222222-2222-4222-8222-222222222222",
    "active",
    "static-token-secret",
    contributorPublicKey,
    bytesToHex(contributorKey),
    1,
  );
  db.prepare("INSERT INTO directus_users VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
    randomUUID(),
    null,
    null,
    "plain@example.com",
    await argon2.hash("another password", { type: argon2.argon2id }),
    null,
    "active",
    null,
    null,
    null,
    0,
  );
  db.prepare("INSERT INTO directus_files VALUES (?, ?)").run(
    "22222222-2222-4222-8222-222222222222",
    "avatar.png",
  );
  db.prepare("INSERT INTO directus_settings VALUES (1,?,?,?,?,?,?,?)").run(
    "Anonymous store",
    systemKeys.stable.publicKey,
    systemKeys.stable.privateKey,
    systemKeys.beta.publicKey,
    systemKeys.beta.privateKey,
    systemKeys.deprecated.publicKey,
    systemKeys.deprecated.privateKey,
  );
  db.prepare("INSERT INTO directus_sessions VALUES ('session-token')").run();
  db.prepare("INSERT INTO ddf_uuids VALUES (?,?,?,?)").run(
    uuid,
    userId,
    "2024-01-02 03:04:05",
    null,
  );
  db.prepare("INSERT INTO bundles VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
    bundleId,
    userId,
    "2024-01-02 03:04:05",
    uuid,
    "2024-01-01T00:00:00.000Z",
    "Vendor",
    "Product",
    "2.28.0",
    "info.md",
    content,
    stored.length,
    5,
    createHash("sha256").update(stored).digest("hex"),
    null,
  );
  db.prepare("INSERT INTO device_identifiers VALUES (?,?,?)").run(
    "33333333-3333-4333-8333-333333333333",
    "Maker",
    "Model",
  );
  db.prepare("INSERT INTO bundles_device_identifiers VALUES (1,?,?)").run(
    bundleId,
    "33333333-3333-4333-8333-333333333333",
  );
  db.prepare("INSERT INTO signatures VALUES (?,?,?,?)").run(
    randomUUID(),
    contributorPublicKey,
    bundleId,
    "user",
  );
  db.prepare("INSERT INTO sub_devices VALUES ('s1','ignored')").run();
  db.prepare("INSERT INTO bundles_sub_devices VALUES (1,?, 's1')").run(bundleId);
  db.close();

  return { path, bundleId, bundleBytes: stored, userId, uuid, systemKeys };
}
