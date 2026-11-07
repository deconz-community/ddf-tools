import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "../src/db/database.js";
import { createApp } from "../src/http/app.js";
import * as schema from "../src/db/schema.js";

export interface SeedBundle {
  id?: string;
  ddf_uuid?: string;
  vendor?: string;
  product?: string;
  version_deconz?: string;
  info?: string | null;
  source_last_modified?: string;
  date_created?: string;
  deprecation_message?: string | null;
  content?: Buffer;
  devices?: Array<{ manufacturer: string; model: string }>;
  signatures?: Array<{ key: string; type: "system" | "user" }>;
}

export function createTestStore() {
  const client = new Database(":memory:");
  client.pragma("foreign_keys = ON");
  const database = drizzle(client, { schema });
  runMigrations(database);
  const app = createApp(database);

  function seedBundle(input: SeedBundle = {}) {
    const id = input.id ?? randomUUID();
    const ddfUuid = input.ddf_uuid ?? randomUUID();
    const content = input.content ?? Buffer.from(id);
    const created = input.date_created ?? "2024-01-01T00:00:00.000Z";

    database
      .insert(schema.ddfUuids)
      .values({ id: ddfUuid, date_created: new Date(created) })
      .onConflictDoNothing()
      .run();
    database
      .insert(schema.bundles)
      .values({
        id,
        ddf_uuid: ddfUuid,
        date_created: new Date(created),
        source_last_modified: new Date(input.source_last_modified ?? created),
        vendor: input.vendor ?? "Vendor",
        product: input.product ?? "Product",
        version_deconz: input.version_deconz ?? "2.28.0",
        info: input.info ?? null,
        content,
        content_size: content.length,
        file_count: 1,
        content_hash: `hash-${id}`,
        deprecation_message: input.deprecation_message ?? null,
      })
      .run();

    for (const device of input.devices ?? []) {
      const identifier = database
        .insert(schema.deviceIdentifiers)
        .values({ id: randomUUID(), ...device })
        .onConflictDoUpdate({
          target: [schema.deviceIdentifiers.manufacturer, schema.deviceIdentifiers.model],
          set: { model: device.model },
        })
        .returning()
        .get();
      database
        .insert(schema.bundlesDeviceIdentifiers)
        .values({ bundles_id: id, device_identifiers_id: identifier.id })
        .run();
    }

    for (const signature of input.signatures ?? []) {
      database
        .insert(schema.signatures)
        .values({ id: randomUUID(), bundle: id, ...signature })
        .run();
    }

    return { id, ddf_uuid: ddfUuid, content };
  }

  return { app, client, database, seedBundle };
}
