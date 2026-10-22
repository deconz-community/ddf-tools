import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ErrorCode = "validation_error" | "bundle_not_found";

export function errorResponse(
  context: Context,
  status: ContentfulStatusCode,
  code: ErrorCode,
  message: string,
  details?: unknown,
) {
  return context.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    status,
  );
}
