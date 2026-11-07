import { and, eq, gt } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { createHash } from "node:crypto";
import type { StoreDatabase } from "../db/database.js";
import { errorResponse } from "../http/errors.js";
import { apiTokens, rateLimits, sessions, users } from "../db/schema.js";
import type { AccountOptions } from "./accounts.js";

export const cookieName = "store_session";

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function sessionUser(database: StoreDatabase, context: Context, timestamp: number) {
  const token = getCookie(context, cookieName);
  if (!token) return null;
  const [session] = await database
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, timestamp)))
    .limit(1);
  if (!session) return null;
  const [user] = await database.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}

export type StoreAuthentication =
  | { user: typeof users.$inferSelect }
  | { error: "unauthenticated" | "invalid_api_token" | "token_revoked" };

const authenticationMessages = {
  unauthenticated: "Sign in to continue.",
  invalid_api_token: "The API token is invalid.",
  token_revoked: "The API token has been revoked.",
};

// A Bearer header takes precedence over any cookie so API tokens never fall back to a session.
export async function authenticateStoreRequest(
  database: StoreDatabase,
  context: Context,
  timestamp: number,
): Promise<StoreAuthentication> {
  const header = context.req.header("authorization");
  if (header !== undefined) {
    const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
    if (!match) return { error: "invalid_api_token" };
    const [record] = await database
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, tokenHash(match[1]!)))
      .limit(1);
    if (!record) return { error: "invalid_api_token" };
    if (record.revokedAt !== null) return { error: "token_revoked" };
    const [user] = await database.select().from(users).where(eq(users.id, record.userId)).limit(1);
    if (!user) return { error: "invalid_api_token" };
    await database
      .update(apiTokens)
      .set({ lastUsedAt: timestamp })
      .where(eq(apiTokens.id, record.id));
    return { user };
  }

  const user = await sessionUser(database, context, timestamp);
  return user ? { user } : { error: "unauthenticated" };
}

export function authenticationErrorResponse(
  context: Context,
  error: keyof typeof authenticationMessages,
) {
  return context.json({ error: { code: error, message: authenticationMessages[error] } }, 401);
}

export type AuthorizationEnvironment = {
  Variables: { authenticatedUser: { id: string; isContributor: boolean } };
};

export function requireAuthentication(
  database: StoreDatabase,
  options: AccountOptions,
): MiddlewareHandler<AuthorizationEnvironment> {
  return async (context, next) => {
    const authentication = await authenticateStoreRequest(
      database,
      context,
      options.now?.() ?? Date.now(),
    );
    if ("error" in authentication)
      return authenticationErrorResponse(context, authentication.error);
    context.set("authenticatedUser", {
      id: authentication.user.id,
      isContributor: authentication.user.isContributor,
    });
    await next();
  };
}

export const requireContributor: MiddlewareHandler<AuthorizationEnvironment> = async (
  context,
  next,
) => {
  if (!context.get("authenticatedUser").isContributor) {
    return errorResponse(
      context,
      403,
      "contributor_required",
      "Only contributors can change system bundle signatures.",
    );
  }
  await next();
};

export async function rateLimited(
  database: StoreDatabase,
  context: Context,
  endpoint: string,
  email: string | undefined,
  timestamp: number,
): Promise<boolean> {
  const ip =
    context.req.header("cf-connecting-ip") ??
    context.req.header("x-real-ip") ??
    context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const identifiers = [{ scope: "ip", value: ip, limit: 20 }];
  if (email) identifiers.push({ scope: "email", value: email, limit: 5 });

  for (const { scope, value, limit } of identifiers) {
    const key = tokenHash(`${endpoint}:${scope}:${value}`);
    const [record] = await database
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);
    const windowStartedAt = record?.windowStartedAt ?? 0;
    if (!record || timestamp - windowStartedAt >= 15 * 60 * 1000) {
      await database
        .insert(rateLimits)
        .values({ key, count: 1, windowStartedAt: timestamp })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: 1, windowStartedAt: timestamp },
        });
    } else if (record.count >= limit) {
      return true;
    } else {
      await database
        .update(rateLimits)
        .set({ count: record.count + 1 })
        .where(eq(rateLimits.key, key));
    }
  }
  return false;
}

export function tooManyRequests(context: Context) {
  context.header("Retry-After", "900");
  return context.json(
    { error: { code: "rate_limited", message: "Too many requests. Try again later." } },
    429,
  );
}
