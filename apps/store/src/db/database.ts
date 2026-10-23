import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.js";

export function openDatabase(path: string): { client: Database.Database; database: StoreDatabase } {
  const databasePath = path === ":memory:" ? path : resolve(path);
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const client = new Database(databasePath);
  try {
    client.pragma("journal_mode = WAL");
    client.pragma("foreign_keys = ON");

    return { client, database: drizzle(client, { schema }) };
  } catch (error) {
    client.close();
    throw error;
  }
}

export type StoreDatabase = ReturnType<typeof drizzle<typeof schema>>;

export function runMigrations(database: StoreDatabase): void {
  migrate(database, {
    migrationsFolder: resolve(dirname(fileURLToPath(import.meta.url)), "../../drizzle"),
  });
}
