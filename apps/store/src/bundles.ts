import { zValidator } from "@hono/zod-validator";
import { sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { StoreDatabase } from "./database.js";
import { errorResponse } from "./errors.js";

export const SEARCH_PAGE_SIZE_LIMIT = 20;

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const searchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(SEARCH_PAGE_SIZE_LIMIT)
    .transform((value) => Math.min(value, SEARCH_PAGE_SIZE_LIMIT)),
  vendor: optionalText,
  product: optionalText,
  manufacturer: optionalText,
  model: optionalText,
  has_key: optionalText,
  show_deprecated: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const contains = (column: SQL, value: string) => sql`instr(lower(${column}), lower(${value})) > 0`;
const inList = (values: string[]) =>
  sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  );

interface SearchRow {
  id: string;
  ddf_uuid: string;
  vendor: string;
  product: string;
  version_deconz: string;
  info: string | null;
  source_last_modified: string;
  content_hash: string;
  deprecation_message: string | null;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .toLowerCase();
}

function searchBundles(database: StoreDatabase, query: z.output<typeof searchQuerySchema>) {
  // Filters apply to the latest bundle of each DDF UUID, never to superseded versions.
  const filters: SQL[] = [sql`l.rn = 1`];
  if (query.vendor) filters.push(contains(sql`b.vendor`, query.vendor));
  if (query.product) filters.push(contains(sql`b.product`, query.product));
  if (query.manufacturer || query.model) {
    const identifierFilters: SQL[] = [];
    if (query.manufacturer) {
      identifierFilters.push(contains(sql`di.manufacturer`, query.manufacturer));
    }
    if (query.model) identifierFilters.push(contains(sql`di.model`, query.model));
    const identifierCondition = sql.join(identifierFilters, sql` AND `);
    filters.push(sql`EXISTS (
      SELECT 1 FROM bundles_device_identifiers bdi
      JOIN device_identifiers di ON di.id = bdi.device_identifiers_id
      WHERE bdi.bundles_id = b.id AND ${identifierCondition}
    )`);
  }
  if (query.has_key) {
    filters.push(
      sql`EXISTS (SELECT 1 FROM signatures s WHERE s.bundle = b.id AND s."key" = ${query.has_key})`,
    );
  }
  if (!query.show_deprecated) filters.push(sql`b.deprecation_message IS NULL`);

  const where = sql.join(filters, sql` AND `);
  const offset = (query.page - 1) * query.limit;
  const from = sql`FROM bundles b
    JOIN (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY ddf_uuid
        ORDER BY source_last_modified DESC, date_created DESC, id DESC
      ) AS rn
      FROM bundles
    ) l ON l.id = b.id
    WHERE ${where}`;

  const total = database.get<{ count: number }>(sql`SELECT COUNT(*) AS count ${from}`);
  const rows = database.all<SearchRow>(sql`
    SELECT b.id, b.ddf_uuid, b.vendor, b.product, b.version_deconz, b.info, b.deprecation_message,
      b.source_last_modified, b.content_hash
    ${from}
    ORDER BY b.source_last_modified DESC, b.date_created DESC, b.id DESC
    LIMIT ${query.limit} OFFSET ${offset}`);

  const ids = inList(rows.map((row) => row.id));
  const devices = rows.length
    ? database.all<{ bundle: string; manufacturer: string; model: string }>(sql`
        SELECT bdi.bundles_id AS bundle, di.manufacturer, di.model
        FROM bundles_device_identifiers bdi
        JOIN device_identifiers di ON di.id = bdi.device_identifiers_id
        WHERE bdi.bundles_id IN (${ids})
        ORDER BY bdi.id`)
    : [];
  const signatures = rows.length
    ? database.all<{ bundle: string; key: string; type: "system" | "user" }>(sql`
        SELECT bundle, "key", type FROM signatures
        WHERE bundle IN (${ids})
        ORDER BY rowid`)
    : [];

  return {
    items: rows.map((row) => ({
      ...row,
      device_identifiers: devices
        .filter((device) => device.bundle === row.id)
        .map(({ manufacturer, model }) => ({ manufacturer, model })),
      signatures: signatures
        .filter((signature) => signature.bundle === row.id)
        .map(({ key, type }) => ({ key, type })),
    })),
    total_count: total?.count ?? 0,
    page: query.page,
    limit: query.limit,
  };
}

export function bundlesRoutes(database: StoreDatabase) {
  return new Hono()
    .get(
      "/bundles",
      zValidator("query", searchQuerySchema, (result, context) => {
        if (!result.success) {
          return errorResponse(
            context,
            422,
            "validation_error",
            "Invalid query parameters",
            result.error.issues,
          );
        }
      }),
      (context) => {
        const result = searchBundles(database, context.req.valid("query"));
        context.header("Cache-Control", "no-store");
        return context.json(result);
      },
    )
    .get("/bundles/:id/download", (context) => {
      const id = context.req.param("id");
      const bundle = database.get<{
        product: string;
        content: Buffer;
        content_hash: string;
      }>(sql`SELECT product, content, content_hash FROM bundles WHERE id = ${id}`);

      if (!bundle) {
        return errorResponse(context, 404, "bundle_not_found", `Bundle ${id} was not found`);
      }

      const slug = slugify(bundle.product + "-" + id.slice(-10)) || "bundle";
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(bundle.content));
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "application/x-deconz-ddf-bundle",
            "Content-Length": String(bundle.content.length),
            "Content-Disposition": "attachment; filename=" + slug + ".ddb",
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: '"' + bundle.content_hash + '"',
          },
        },
      );
    });
}
