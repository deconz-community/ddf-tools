import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../src/app.js";
import * as schema from "../src/schema.js";

describe("GET /health", () => {
  const databases: Array<{ open: boolean; close(): void }> = [];

  afterEach(() => {
    for (const database of databases.splice(0)) {
      if (database.open) database.close();
    }
  });

  it("reports healthy when SQLite is reachable", async () => {
    const database = new Database(":memory:");
    databases.push(database);
    const app = createApp(drizzle(database, { schema }));

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "healthy" });
  });

  it("reports unhealthy when SQLite is unreachable", async () => {
    const database = new Database(":memory:");
    databases.push(database);
    const app = createApp(drizzle(database, { schema }));
    database.close();

    const response = await app.request("/health");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unhealthy" });
  });
});
