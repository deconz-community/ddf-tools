import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { StoreDatabase } from "./database.js";

export function createApp(database: StoreDatabase) {
  return new Hono().get("/health", (context) => {
    try {
      database.run(sql`SELECT 1`);
      return context.json({ status: "healthy" });
    } catch {
      return context.json({ status: "unhealthy" }, 503);
    }
  });
}
