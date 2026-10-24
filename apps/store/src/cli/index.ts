import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.js";
import { openDatabase, runMigrations } from "../db/database.js";
import { migrateDirectus } from "./migrate-directus.js";
import { users } from "../db/schema.js";

const usage = `Usage:
  migrate:directus <source.db>                       one-shot import of a Directus SQLite copy
  user:create <email> [--contributor]                 password is read from STORE_USER_PASSWORD
  user:contributor <email> [--revoke]                 grant or revoke the contributor role
  system-key:generate <beta|stable|deprecated>        print a new system signing key pair
  db:reset --yes                                      delete ALL data from the database (irreversible)`;

const SYSTEM_KEYS = ["beta", "stable", "deprecated"];

class CliError extends Error {}

function withDatabase<T>(
  env: NodeJS.ProcessEnv,
  run: (db: ReturnType<typeof openDatabase>["database"]) => Promise<T> | T,
) {
  const { client, database } = openDatabase(loadConfig(env).databasePath);
  return (async () => {
    try {
      runMigrations(database);
      return await run(database);
    } finally {
      client.close();
    }
  })();
}

export async function runCli(
  args: string[],
  env: NodeJS.ProcessEnv,
  print: (line: string) => void = console.log,
): Promise<number> {
  const [command, ...rest] = args;
  const positional = rest.filter((arg) => !arg.startsWith("--"));
  try {
    switch (command) {
      case "migrate:directus": {
        const [sourcePath] = positional;
        if (!sourcePath) throw new CliError(usage);
        const report = await withDatabase(env, (database) =>
          migrateDirectus({
            sourcePath,
            database,
          }),
        );
        for (const row of report.tables) print(`${row.table}: ${row.migrated} of ${row.source}`);
        print(`${report.bundlesVerified} bundle(s) verified (hash and signatures)`);
        if (report.skippedTables.length > 0)
          print(`not migrated: ${report.skippedTables.join(", ")}`);
        return 0;
      }
      case "user:create": {
        const [rawEmail] = positional;
        const password = env.STORE_USER_PASSWORD;
        if (!rawEmail) throw new CliError(usage);
        if (!password || password.length < 8 || password.length > 128) {
          throw new CliError("Set STORE_USER_PASSWORD to a password of 8 to 128 characters.");
        }
        const email = rawEmail.toLowerCase();
        const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
        const privateKey = secp256k1.utils.randomSecretKey();
        const id = randomUUID();
        const now = Date.now();
        await withDatabase(env, (database) => {
          if (database.select().from(users).where(eq(users.email, email)).get()) {
            throw new CliError(`A user with email ${email} already exists.`);
          }
          database
            .insert(users)
            .values({
              id,
              email,
              passwordHash,
              publicKey: bytesToHex(secp256k1.getPublicKey(privateKey)),
              privateKey: bytesToHex(privateKey),
              isContributor: rest.includes("--contributor"),
              emailVerifiedAt: now,
              createdAt: now,
              updatedAt: now,
            })
            .run();
        });
        print(`Created user ${email} (${id})`);
        return 0;
      }
      case "user:contributor": {
        const [rawEmail] = positional;
        if (!rawEmail) throw new CliError(usage);
        const email = rawEmail.toLowerCase();
        const contributor = !rest.includes("--revoke");
        await withDatabase(env, (database) => {
          const result = database
            .update(users)
            .set({ isContributor: contributor, updatedAt: Date.now() })
            .where(eq(users.email, email))
            .run();
          if (result.changes === 0) throw new CliError(`No user with email ${email}.`);
        });
        print(`${email} is ${contributor ? "now" : "no longer"} a contributor`);
        return 0;
      }
      case "system-key:generate": {
        const [name] = positional;
        if (!name || !SYSTEM_KEYS.includes(name)) {
          throw new CliError(`Specify the key to generate: ${SYSTEM_KEYS.join(", ")}.`);
        }
        const privateKey = secp256k1.utils.randomSecretKey();
        print(`${name.toUpperCase()}_PRIVATE_KEY=${bytesToHex(privateKey)}`);
        print(`public key: ${bytesToHex(secp256k1.getPublicKey(privateKey))}`);
        return 0;
      }
      case "db:reset": {
        if (!rest.includes("--yes")) {
          throw new CliError("This deletes ALL data. Re-run with --yes to confirm.");
        }
        const tables = await withDatabase(env, (database) => {
          const names = database
            .all<{ name: string }>(
              sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`,
            )
            .map((row) => row.name);
          // Foreign keys are disabled so tables can be emptied in any order.
          database.$client.pragma("foreign_keys = OFF");
          try {
            database.$client.transaction(() => {
              for (const name of names) {
                database.$client.prepare(`DELETE FROM "${name.replaceAll('"', '""')}"`).run();
              }
            })();
          } finally {
            database.$client.pragma("foreign_keys = ON");
          }
          return names;
        });
        print(`Database emptied (${tables.length} table(s) cleared)`);
        return 0;
      }
      default:
        throw new CliError(usage);
    }
  } catch (error) {
    print(
      error instanceof CliError
        ? error.message
        : `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await runCli(process.argv.slice(2), process.env);
}
