import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { decode, generateHash, verifySignature } from "@deconz-community/ddf-bundler";
import { inflateSync } from "node:zlib";
import type { StoreDatabase } from "./database.js";
import * as schema from "./schema.js";

export interface MigrationOptions {
  sourcePath: string;
  database: StoreDatabase;
  publicUrl?: string;
  now?: () => number;
}

export interface MigrationReport {
  tables: Array<{ table: string; source: number; migrated: number }>;
  bundlesVerified: number;
  skippedTables: string[];
}

type Row = Record<string, unknown>;

const SYSTEM_KEY_SETTINGS = ["stable", "beta", "deprecated"].flatMap((name) => [
  `public_key_${name}`,
  `private_key_${name}`,
]);
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
function isoDate(value: unknown, label: string): string {
  let date: Date;
  if (typeof value === "number") date = new Date(value);
  else {
    const raw = required(value, label);
    date = new Date(
      /^\d{4}-\d\d-\d\d \d\d:\d\d(:\d\d(\.\d+)?)?$/.test(raw) ? `${raw.replace(" ", "T")}Z` : raw,
    );
  }
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date in ${label}: ${String(value)}`);
  return date.toISOString();
}

function optionalDate(value: unknown, label: string): string | null {
  return value === null || value === undefined || value === "" ? null : isoDate(value, label);
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

async function verifyBundle(bundle: Row, content: Buffer, signatureKeys: string[]): Promise<void> {
  const id = required(bundle.id, "bundle id");
  const fail = (reason: string): never => {
    throw new Error(`Bundle ${id} failed verification: ${reason}`);
  };

  if (bytesToHex(sha256(new Uint8Array(content))) !== bundle.content_hash) {
    fail("content hash does not match the stored bytes");
  }
  const decoded = await decode(new Blob([new Uint8Array(content)]));
  const hash = await generateHash(decoded.data);
  if (bytesToHex(hash) !== id) fail("bundle hash does not match the bundle id");

  const bundleKeys: string[] = [];
  for (const signature of decoded.data.signatures) {
    if (!(await verifySignature(hash, signature.key, signature.signature))) {
      fail(`invalid signature from ${bytesToHex(signature.key)}`);
    }
    bundleKeys.push(bytesToHex(signature.key));
  }
  for (const key of signatureKeys) {
    if (!bundleKeys.includes(key)) fail(`signature row ${key} is not present in the bundle`);
  }
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
  const now = options.now ?? Date.now;
  const source = new Database(options.sourcePath, { readonly: true, fileMustExist: true });
  try {
    const available = tableNames(source);
    for (const required of ["directus_users", "bundles", "ddf_uuids", "signatures"]) {
      if (!available.has(required)) throw new Error(`Source database has no ${required} table.`);
    }
    const rows = (table: string): Row[] => (available.has(table) ? readAll(source, table) : []);
    const timestamp = now();

    const files = new Set(rows("directus_files").map((file) => String(file.id)));
    const users = rows("directus_users").map((user) => {
      let avatarUrl: string | null = null;
      const avatar = text(user.avatar);
      if (avatar) {
        if (!options.publicUrl) {
          throw new Error("A public URL is required to convert user avatars to avatar_url values.");
        }
        if (files.has(avatar)) {
          avatarUrl = `${options.publicUrl.replace(/\/+$/, "")}/assets/${avatar}`;
        }
      }
      return {
        id: required(user.id, "user id"),
        email: required(user.email, "user email").toLowerCase(),
        passwordHash: text(user.password) ?? "",
        firstName: text(user.first_name),
        lastName: text(user.last_name),
        avatarUrl,
        publicKey: text(user.public_key),
        privateKey: text(user.private_key),
        isContributor: Number(user.is_contributor) === 1,
        emailVerifiedAt: user.status === "active" ? timestamp : null,
        createdAt: Date.parse(isoDate(user.date_created, "directus_users.date_created")),
        updatedAt: timestamp,
      };
    });

    const settingsRow = rows("directus_settings")[0] ?? {};
    const settings = SYSTEM_KEY_SETTINGS.flatMap((key) => {
      const value = text(settingsRow[key]);
      return value ? [{ key, value }] : [];
    });

    const ddfUuids = rows("ddf_uuids").map((row) => ({
      id: required(row.id, "ddf uuid"),
      date_created: isoDate(row.date_created, "ddf_uuids.date_created"),
      expire_at: optionalDate(row.expire_at, "ddf_uuids.expire_at"),
      owner_id: text(row.user_created),
    }));

    const signatureRows = rows("signatures");
    const keysByBundle = new Map<string, string[]>();
    for (const row of signatureRows) {
      const bundle = String(row.bundle);
      keysByBundle.set(bundle, [...(keysByBundle.get(bundle) ?? []), String(row.key)]);
    }

    const bundles: Array<typeof schema.bundles.$inferInsert> = [];
    for (const row of rows("bundles")) {
      const id = required(row.id, "bundle id");
      let content: Buffer;
      try {
        content = inflateSync(Buffer.from(required(row.content, "bundle content"), "base64"));
      } catch (error) {
        throw new Error(`Bundle ${id} content could not be decompressed: ${String(error)}`);
      }
      await verifyBundle(row, content, keysByBundle.get(id) ?? []);
      bundles.push({
        id,
        ddf_uuid: required(row.ddf_uuid, "bundle ddf_uuid"),
        date_created: isoDate(row.date_created, "bundles.date_created"),
        source_last_modified: isoDate(row.source_last_modified, "bundles.source_last_modified"),
        vendor: required(row.vendor, "bundle vendor"),
        product: required(row.product, "bundle product"),
        version_deconz: required(row.version_deconz, "bundle version_deconz"),
        info: text(row.info),
        content,
        content_size: content.length,
        file_count: Number(row.file_count),
        content_hash: String(row.content_hash),
        deprecation_message: text(row.deprecation_message),
      });
    }

    const deviceIdentifiers = rows("device_identifiers").map((row) => ({
      id: required(row.id, "device identifier id"),
      manufacturer: required(row.manufacturer, "device manufacturer"),
      model: required(row.model, "device model"),
    }));
    const links = rows("bundles_device_identifiers").map((row) => ({
      id: Number(row.id),
      bundles_id: required(row.bundles_id, "bundles_id"),
      device_identifiers_id: required(row.device_identifiers_id, "device_identifiers_id"),
    }));
    const signatures = signatureRows.map((row) => ({
      id: required(row.id, "signature id"),
      key: required(row.key, "signature key"),
      bundle: required(row.bundle, "signature bundle"),
      type: row.type === "system" ? ("system" as const) : ("user" as const),
    }));

    const plan = [
      ["users", schema.users, users, rows("directus_users").length],
      ["settings", schema.settings, settings, settings.length],
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
