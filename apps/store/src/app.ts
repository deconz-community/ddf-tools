import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { bundlesRoutes } from "./bundles.js";
import type { StoreDatabase } from "./database.js";

export function createApp(database: StoreDatabase) {
  return new Hono()
    .get("/health", (context) => {
      try {
        database.run(sql`SELECT 1`);
        return context.json({ status: "healthy" });
      } catch {
        return context.json({ status: "unhealthy" }, 503);
      }
    })
    .route("/v1", bundlesRoutes(database));
}

export type AppType = ReturnType<typeof createApp>;
export type { ErrorCode } from "./errors.js";
