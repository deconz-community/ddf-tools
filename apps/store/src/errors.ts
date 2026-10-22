import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ErrorCode =
  | "validation_error"
  | "bundle_not_found"
  | "bundle_forbidden"
  | "contributor_required"
  | "invalid_deprecation_message"
  | "system_signing_unavailable"
  | "system_key_invalid"
  | "signing_failed";

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
