import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { registerAccountRoutes, type AccountOptions } from "./accounts.js";
import type { StoreDatabase } from "./database.js";

export function createApp(database: StoreDatabase, options: AccountOptions = {}) {
  const api = new Hono();
  api.onError((error, context) => {
    console.error("Store API request failed.", error);
    return context.json(
      { error: { code: "internal_error", message: "The request could not be completed." } },
      500,
    );
  });
  api.notFound((context) =>
    context.json(
      { error: { code: "not_found", message: "The requested resource does not exist." } },
      404,
    ),
  );
  registerAccountRoutes(api, database, options);

  return new Hono()
    .use("/api/v1/*", async (context, next) => {
      const origin = context.req.header("origin");
      const allowed = origin !== undefined && (options.allowedOrigins ?? []).includes(origin);
      if (origin && !allowed) {
        return context.json(
          { error: { code: "origin_not_allowed", message: "This origin is not allowed." } },
          403,
        );
      }
      if (allowed) {
        context.header("Access-Control-Allow-Origin", origin);
        context.header("Access-Control-Allow-Credentials", "true");
        context.header("Vary", "Origin");
      }
      if (context.req.method === "OPTIONS") {
        if (!allowed) {
          return context.json(
            { error: { code: "origin_not_allowed", message: "This origin is not allowed." } },
            403,
          );
        }
        context.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
        context.header("Access-Control-Allow-Headers", "Content-Type, X-Store-Request");
        context.header("Access-Control-Max-Age", "600");
        return context.body(null, 204);
      }
      if (
        !["GET", "HEAD"].includes(context.req.method) &&
        (!allowed || context.req.header("x-store-request") !== "1")
      ) {
        return context.json(
          { error: { code: "csrf_rejected", message: "Origin and request header are required." } },
          403,
        );
      }
      await next();
    })
    .route("/api/v1", api)
    .get("/health", (context) => {
      try {
        database.run(sql`SELECT 1`);
        return context.json({ status: "healthy" });
      } catch {
        return context.json({ status: "unhealthy" }, 503);
      }
    });
}
