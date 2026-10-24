import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import {
  createSignature,
  decode,
  encode,
  generateHash,
  verifySignature,
} from "@deconz-community/ddf-bundler";
import { inflateSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import type { StoreDatabase } from "../db/database.js";
import * as schema from "../db/schema.js";

export interface MigrationOptions {
  sourcePath: string;
  database: StoreDatabase;
  publicUrl?: string;
}

export interface MigrationReport {
  tables: Array<{ table: string; source: number; migrated: number }>;
  bundlesVerified: number;
  skippedTables: string[];
}

type Row = Record<string, unknown>;

const IMPORTED_TABLES = new Set([
  "directus_users",
  "directus_files",
  "directus_settings",
  "ddf_uuids",
  "bundles",
  "device_identifiers",
  "bundles_device_identifiers",
  "signatures",
]);

function text(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function required(value: unknown, label: string): string {
  const result = text(value);
  if (result === null) throw new Error(`Source row is missing ${label}.`);
  return result;
}

// Directus stores datetimes as ISO strings, "YYYY-MM-DD HH:MM:SS" strings or epoch milliseconds.
function parseDate(value: unknown, label: string): Date {
  let date: Date;
  if (typeof value === "number") date = new Date(value);
  else {
    const raw = required(value, label);
    date = new Date(
      /^\d{4}-\d\d-\d\d \d\d:\d\d(:\d\d(\.\d+)?)?$/.test(raw) ? `${raw.replace(" ", "T")}Z` : raw,
    );
  }
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date in ${label}: ${String(value)}`);
  return date;
}

function optionalDate(value: unknown, label: string): Date | null {
  return value === null || value === undefined || value === "" ? null : parseDate(value, label);
}

function tableNames(source: Database.Database): Set<string> {
  return new Set(
    (
      source
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .all() as Array<{ name: string }>
    ).map((row) => row.name),
  );
}

function readAll(source: Database.Database, table: string): Row[] {
  return source.prepare(`SELECT * FROM "${table}"`).all() as Row[];
}

async function verifyBundle(
  bundle: Row,
  content: Buffer,
  knownKeys: Record<string, { privateKey: string; type: "user" | "system" }>,
): Promise<{
  id: string;
  content: Buffer;
  contentHash: string;
  signatures: Array<{ key: string; type: "user" | "system" }>;
}> {
  const id = required(bundle.id, "bundle id");
  const fail = (reason: string): never => {
    throw new Error(`Bundle ${id} failed verification: ${reason}`);
  };

  if (bytesToHex(sha256(new Uint8Array(content))) !== bundle.content_hash) {
    fail("content hash does not match the stored bytes");
  }
  const decoded = await decode(new Blob([new Uint8Array(content)]));
  const hash = await generateHash(decoded.data);
  const migratedId = bytesToHex(hash);

  const signatures: Array<{ key: string; type: "user" | "system" }> = [];

  for (const signature of decoded.data.signatures) {
    const keyHex = bytesToHex(signature.key);
    const keyInfo = knownKeys[keyHex];
    if (!keyInfo) fail(`unknown key ${keyHex}`);

    signature.signature = createSignature(hash, hexToBytes(keyInfo.privateKey));
    if (!(await verifySignature(hash, signature.key, signature.signature))) {
      fail(`private key does not match public key ${keyHex}`);
    }
    signatures.push({ key: keyHex, type: keyInfo.type });
  }

  const migratedContent = Buffer.from(await encode(decoded).arrayBuffer());
  return {
    id: migratedId,
    content: migratedContent,
    contentHash: bytesToHex(sha256(new Uint8Array(migratedContent))),
    signatures,
  };
}

function assertTargetEmpty(database: StoreDatabase): void {
  const tables = database
    .all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    .filter(({ name }) => !name.startsWith("sqlite_") && !name.startsWith("__drizzle"));
  for (const { name } of tables) {
    const row = database.get<{ found: number }>(
      sql.raw(`SELECT 1 AS found FROM "${name}" LIMIT 1`),
    );
    if (row) throw new Error(`The target database is not empty (table ${name} has rows).`);
  }
}

export async function migrateDirectus(options: MigrationOptions): Promise<MigrationReport> {
  const source = new Database(options.sourcePath, { readonly: true, fileMustExist: true });
  try {
    const available = tableNames(source);
    for (const required of ["directus_users", "directus_settings", "bundles", "ddf_uuids"]) {
      if (!available.has(required)) throw new Error(`Source database has no ${required} table.`);
    }
    const rows = (table: string): Row[] => (available.has(table) ? readAll(source, table) : []);
    const timestamp = Date.now();

    const knownKeys: Record<string, { privateKey: string; type: "user" | "system" }> = {};
    const users = rows("directus_users").map((user) => {
      const public_key = text(user.public_key);
      const private_key = text(user.private_key);
      if (
        typeof public_key === "string" &&
        public_key.length > 0 &&
        typeof private_key === "string" &&
        private_key.length > 0
      ) {
        knownKeys[public_key] = { privateKey: private_key, type: "user" };
      }
      return {
        id: required(user.id, "user id"),
        email: required(user.email, "user email").toLowerCase(),
        passwordHash: text(user.password) ?? "",
        username:
          [text(user.first_name), text(user.last_name)].filter((part) => part).join(" ") || null,
        publicKey: public_key,
        privateKey: private_key,
        isContributor: Number(user.is_contributor) === 1,
        emailVerifiedAt: user.status === "active" ? timestamp : null,
        createdAt: parseDate(user.date_created, "directus_users.date_created").getTime(),
        updatedAt: timestamp,
      };
    });

    const settingsRow = rows("directus_settings")[0] ?? {};

    for (const name of ["stable", "beta", "deprecated"] as const) {
      const publicKey = settingsRow[`public_key_${name}`];
      const privateKey = settingsRow[`private_key_${name}`];
      if (
        typeof publicKey === "string" &&
        publicKey.length > 0 &&
        typeof privateKey === "string" &&
        privateKey.length > 0
      ) {
        knownKeys[publicKey] = { privateKey, type: "system" };
      }
    }

    const ddfUuids = rows("ddf_uuids").map((row) => ({
      id: required(row.id, "ddf uuid"),
      date_created: parseDate(row.date_created, "ddf_uuids.date_created"),
      expire_at: optionalDate(row.expire_at, "ddf_uuids.expire_at"),
      owner_id: text(row.user_created),
    }));

    const bundles: Array<typeof schema.bundles.$inferInsert> = [];
    const signatures: Array<typeof schema.signatures.$inferInsert> = [];
    const bundleIds = new Map<string, string>();
    for (const row of rows("bundles")) {
      const id = required(row.id, "bundle id");
      let content: Buffer;
      try {
        content = inflateSync(Buffer.from(required(row.content, "bundle content"), "base64"));
      } catch (error) {
        throw new Error(`Bundle ${id} content could not be decompressed: ${String(error)}`);
      }

      const migrated = await verifyBundle(row, content, knownKeys);
      bundleIds.set(id, migrated.id);
      for (const signature of migrated.signatures) {
        signatures.push({
          id: randomUUID(),
          key: signature.key,
          bundle: migrated.id,
          type: signature.type,
        });
      }
      bundles.push({
        id: migrated.id,
        ddf_uuid: required(row.ddf_uuid, "bundle ddf_uuid"),
        user_created: text(row.user_created),
        date_created: parseDate(row.date_created, "bundles.date_created"),
        source_last_modified: parseDate(row.source_last_modified, "bundles.source_last_modified"),
        vendor: required(row.vendor, "bundle vendor"),
        product: required(row.product, "bundle product"),
        version_deconz: required(row.version_deconz, "bundle version_deconz"),
        info: text(row.info),
        content: migrated.content,
        content_size: migrated.content.length,
        file_count: Number(row.file_count),
        content_hash: migrated.contentHash,
        deprecation_message: text(row.deprecation_message),
      });
    }

    const deviceIdentifiers = rows("device_identifiers").map((row) => ({
      id: required(row.id, "device identifier id"),
      manufacturer: required(row.manufacturer, "device manufacturer"),
      model: required(row.model, "device model"),
    }));
    const links = rows("bundles_device_identifiers").map((row) => {
      const sourceBundleId = required(row.bundles_id, "bundles_id");
      return {
        id: Number(row.id),
        bundles_id: bundleIds.get(sourceBundleId) ?? sourceBundleId,
        device_identifiers_id: required(row.device_identifiers_id, "device_identifiers_id"),
      };
    });
    const plan = [
      ["users", schema.users, users, rows("directus_users").length],
      ["ddf_uuids", schema.ddfUuids, ddfUuids, ddfUuids.length],
      ["bundles", schema.bundles, bundles, bundles.length],
      ["device_identifiers", schema.deviceIdentifiers, deviceIdentifiers, deviceIdentifiers.length],
      ["bundles_device_identifiers", schema.bundlesDeviceIdentifiers, links, links.length],
      ["signatures", schema.signatures, signatures, signatures.length],
    ] as const;

    const tables: MigrationReport["tables"] = [];
    options.database.transaction((transaction) => {
      assertTargetEmpty(options.database);
      for (const [name, table, values, sourceCount] of plan) {
        for (const value of values)
          transaction
            .insert(table)
            .values(value as never)
            .run();
        const migrated = transaction.get<{ count: number }>(
          sql.raw(`SELECT count(*) AS count FROM "${name}"`),
        )?.count;
        if (migrated !== sourceCount) {
          throw new Error(
            `Row count mismatch for ${name}: ${sourceCount} source, ${migrated} migrated.`,
          );
        }
        tables.push({ table: name, source: sourceCount, migrated });
      }
      for (const bundle of bundles) {
        const stored = transaction.get<{ content: Buffer }>(
          sql`SELECT content FROM bundles WHERE id = ${bundle.id}`,
        );
        if (!stored || bytesToHex(sha256(new Uint8Array(stored.content))) !== bundle.content_hash) {
          throw new Error(`Bundle ${bundle.id} changed while being migrated.`);
        }
      }
    });

    return {
      tables,
      bundlesVerified: bundles.length,
      skippedTables: [...available].filter((name) => !IMPORTED_TABLES.has(name)).sort(),
    };
  } finally {
    source.close();
  }
}
