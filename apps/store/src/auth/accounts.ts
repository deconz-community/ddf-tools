import argon2 from "argon2";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { getCookie } from "hono/cookie";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { avatarHash } from "./avatar.js";
import type { StoreDatabase } from "../db/database.js";
import { accountTokens, apiTokens, ddfUuids, rateLimits, sessions, users } from "../db/schema.js";

export interface AccountMailer {
  sendVerification(email: string, token: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
}

export interface AccountOptions {
  allowedOrigins?: string[];
  mailer?: AccountMailer;
  secureCookies?: boolean;
  logger?: Pick<Console, "warn">;
  now?: () => number;
  systemSigningKeys?: Partial<
    Record<"beta" | "stable" | "deprecated", { privateKey: string; publicKey?: string }>
  >;
}

export type SigningKey = { publicKey: string; privateKey: Uint8Array };

const registrationSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  username: z.string().trim().max(100).optional(),
});

const verificationSchema = z.object({ token: z.string().min(1).max(200) });
const resetRequestSchema = z.object({ email: z.string().trim().email().max(254) });
const resetConfirmationSchema = z.object({
  token: z.string().min(1).max(200),
  password: z.string().min(8).max(128),
});
const loginSchema = registrationSchema;
const profileSchema = z
  .object({
    username: z.string().trim().max(100).nullable().optional(),
    public_key: z.string().trim().min(1).max(2048).nullable().optional(),
    private_key: z.string().trim().min(1).max(2048).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
const tokenNameSchema = z.object({ name: z.string().trim().min(1).max(100) });
const tokenLifetime = 24 * 60 * 60 * 1000;
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const cookieName = "store_session";
const dummyPasswordHash = argon2.hash(randomBytes(32).toString("hex"), { type: argon2.argon2id });

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function failure(
  context: Context,
  status: 400 | 401 | 404 | 409 | 500,
  code: string,
  message: string,
) {
  return context.json({ error: { code, message } }, status);
}

function profile(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_hash: user.avatarHash,
    public_key: user.publicKey,
    private_key: user.privateKey,
    is_contributor: user.isContributor,
    email_verified: user.emailVerifiedAt !== null,
    date_created: new Date(user.createdAt).toISOString(),
    last_login: user.lastLoginAt === null ? null : new Date(user.lastLoginAt).toISOString(),
  };
}

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    avatar_hash: user.avatarHash,
    public_key: user.publicKey,
    is_contributor: user.isContributor,
    email_verified: user.emailVerifiedAt !== null,
    date_created: new Date(user.createdAt).toISOString(),
  };
}

function publicUserResponse(context: Context, user: typeof users.$inferSelect) {
  context.header("Cache-Control", "public, max-age=3600");
  return context.json(publicUser(user));
}

function setSessionCookie(context: Context, token: string, secure: boolean) {
  const attributes = [
    `${cookieName}=${token}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${secure ? "None" : "Lax"}`,
    `Max-Age=${Math.floor(sessionLifetime / 1000)}`,
  ];
  if (secure) attributes.push("Secure");
  context.header("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(context: Context, secure: boolean) {
  const attributes = [
    `${cookieName}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${secure ? "None" : "Lax"}`,
    "Max-Age=0",
  ];
  if (secure) attributes.push("Secure");
  context.header("Set-Cookie", attributes.join("; "));
}

async function sessionUser(database: StoreDatabase, context: Context, timestamp: number) {
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

type Authentication =
  | { user: typeof users.$inferSelect }
  | { error: "unauthenticated" | "invalid_api_token" | "token_revoked" };

export type StoreAuthentication = Authentication;

const authenticationMessages = {
  unauthenticated: "Sign in to continue.",
  invalid_api_token: "The API token is invalid.",
  token_revoked: "The API token has been revoked.",
};

// A Bearer header takes precedence over any cookie so API tokens never fall back to a session.
async function authenticate(
  database: StoreDatabase,
  context: Context,
  timestamp: number,
): Promise<Authentication> {
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

export async function authenticateStoreRequest(
  database: StoreDatabase,
  context: Context,
  timestamp: number,
): Promise<StoreAuthentication> {
  return authenticate(database, context, timestamp);
}

export function authenticationErrorResponse(
  context: Context,
  error: keyof typeof authenticationMessages,
) {
  return failure(context, 401, error, authenticationMessages[error]);
}

function tokenView(record: typeof apiTokens.$inferSelect) {
  return {
    id: record.id,
    name: record.name,
    prefix: record.tokenPrefix,
    date_created: new Date(record.createdAt).toISOString(),
    last_used: record.lastUsedAt === null ? null : new Date(record.lastUsedAt).toISOString(),
    revoked: record.revokedAt !== null,
  };
}

async function accountEmailForToken(
  database: StoreDatabase,
  tokenRecord: typeof accountTokens.$inferSelect | undefined,
): Promise<string | undefined> {
  if (!tokenRecord) return undefined;
  const [user] = await database
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, tokenRecord.userId))
    .limit(1);
  return user?.email;
}

async function rateLimited(
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

function tooManyRequests(context: Context) {
  context.header("Retry-After", "900");
  return context.json(
    { error: { code: "rate_limited", message: "Too many requests. Try again later." } },
    429,
  );
}

export function registerAccountRoutes(
  app: Hono,
  database: StoreDatabase,
  options: AccountOptions,
): void {
  const now = options.now ?? Date.now;
  const logger = options.logger ?? console;

  app.post("/ddf-uuids", async (context) => {
    const authentication = await authenticate(database, context, now());
    if ("error" in authentication)
      return authenticationErrorResponse(context, authentication.error);

    const request = z
      .object({ count: z.number().int().min(1).max(100) })
      .strict()
      .safeParse(await context.req.json().catch(() => null));
    if (!request.success) {
      return context.json(
        {
          error: {
            code: "validation_error",
            message: "count must be an integer from 1 to 100",
            details: request.error.issues,
          },
        },
        422,
      );
    }

    const timestamp = now();
    const expireAt = new Date(timestamp + 21 * 24 * 60 * 60 * 1000);
    const uuids = Array.from({ length: request.data.count }, () => randomUUID());
    await database.insert(ddfUuids).values(
      uuids.map((id) => ({
        id,
        date_created: new Date(timestamp),
        expire_at: expireAt,
        owner_id: authentication.user.id,
      })),
    );
    return context.json({ uuids, expire_at: expireAt.toISOString() }, 201);
  });

  app.post("/auth/register", async (context) => {
    const parsed = registrationSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(context, 400, "invalid_request", "Email and a valid password are required.");

    const email = parsed.data.email.toLowerCase();
    const timestamp = now();
    if (await rateLimited(database, context, "register", email, timestamp))
      return tooManyRequests(context);
    const id = randomUUID();
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const verificationToken = options.mailer ? randomBytes(32).toString("base64url") : null;

    try {
      await database.insert(users).values({
        id,
        email,
        passwordHash,
        username: parsed.data.username ?? null,
        avatarHash: avatarHash(email),
        emailVerifiedAt: verificationToken ? null : timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch {
      return failure(context, 409, "email_exists", "An account with this email already exists.");
    }

    if (verificationToken) {
      await database.insert(accountTokens).values({
        id: randomUUID(),
        tokenHash: tokenHash(verificationToken),
        userId: id,
        purpose: "verify_email",
        expiresAt: timestamp + tokenLifetime,
        createdAt: timestamp,
      });
      try {
        await options.mailer!.sendVerification(email, verificationToken);
      } catch {
        await database
          .delete(accountTokens)
          .where(eq(accountTokens.tokenHash, tokenHash(verificationToken)));
        await database.delete(users).where(eq(users.id, id));
        return failure(
          context,
          500,
          "email_delivery_failed",
          "The verification email could not be sent.",
        );
      }
    } else {
      logger.warn("SMTP is not configured; account email verification was skipped.");
    }

    return context.json(
      { user: { id, email }, verification_required: verificationToken !== null },
      201,
    );
  });

  app.post("/auth/verify-email", async (context) => {
    const parsed = verificationSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(context, 400, "invalid_request", "A verification token is required.");
    const timestamp = now();
    const [record] = await database
      .select()
      .from(accountTokens)
      .where(
        and(
          eq(accountTokens.tokenHash, tokenHash(parsed.data.token)),
          eq(accountTokens.purpose, "verify_email"),
        ),
      )
      .limit(1);
    const email = await accountEmailForToken(database, record);
    if (await rateLimited(database, context, "verify-email", email, timestamp))
      return tooManyRequests(context);
    if (!record || record.expiresAt <= timestamp)
      return failure(
        context,
        400,
        "invalid_token",
        "The verification token is invalid or expired.",
      );

    await database
      .update(users)
      .set({ emailVerifiedAt: timestamp, updatedAt: timestamp })
      .where(eq(users.id, record.userId));
    await database.delete(accountTokens).where(eq(accountTokens.id, record.id));
    return context.json({ verified: true });
  });

  app.post("/auth/login", async (context) => {
    const parsed = loginSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(context, 400, "invalid_request", "Email and password are required.");
    const email = parsed.data.email.toLowerCase();
    if (await rateLimited(database, context, "login", email, now()))
      return tooManyRequests(context);
    const [user] = await database.select().from(users).where(eq(users.email, email)).limit(1);
    let passwordValid = false;
    try {
      passwordValid = await argon2.verify(
        user?.passwordHash ?? (await dummyPasswordHash),
        parsed.data.password,
      );
    } catch {
      passwordValid = false;
    }
    if (!user || !passwordValid) {
      return context.json(
        { error: { code: "invalid_credentials", message: "Email or password is incorrect." } },
        401,
      );
    }
    if (user.emailVerifiedAt === null) {
      return context.json(
        { error: { code: "email_not_verified", message: "Verify your email before signing in." } },
        403,
      );
    }

    const timestamp = now();
    const token = randomBytes(32).toString("base64url");
    await database.insert(sessions).values({
      id: randomUUID(),
      tokenHash: tokenHash(token),
      userId: user.id,
      expiresAt: timestamp + sessionLifetime,
      createdAt: timestamp,
    });
    await database.update(users).set({ lastLoginAt: timestamp }).where(eq(users.id, user.id));
    setSessionCookie(context, token, options.secureCookies ?? false);
    return context.json({ user: profile({ ...user, lastLoginAt: timestamp }) });
  });

  app.post("/auth/logout", async (context) => {
    const token = getCookie(context, cookieName);
    const user = await sessionUser(database, context, now());
    if (token) await database.delete(sessions).where(eq(sessions.tokenHash, tokenHash(token)));
    clearSessionCookie(context, options.secureCookies ?? false);
    if (await rateLimited(database, context, "logout", user?.email, now()))
      return tooManyRequests(context);
    return context.body(null, 204);
  });

  app.post("/auth/password-reset/request", async (context) => {
    const parsed = resetRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(context, 400, "invalid_request", "A valid email is required.");
    const email = parsed.data.email.toLowerCase();
    const timestamp = now();
    if (await rateLimited(database, context, "password-reset", email, timestamp))
      return tooManyRequests(context);
    const [user] = await database.select().from(users).where(eq(users.email, email)).limit(1);
    if (user && options.mailer) {
      const token = randomBytes(32).toString("base64url");
      await database
        .delete(accountTokens)
        .where(and(eq(accountTokens.userId, user.id), eq(accountTokens.purpose, "reset_password")));
      await database.insert(accountTokens).values({
        id: randomUUID(),
        tokenHash: tokenHash(token),
        userId: user.id,
        purpose: "reset_password",
        expiresAt: timestamp + tokenLifetime,
        createdAt: timestamp,
      });
      try {
        await options.mailer.sendPasswordReset(email, token);
      } catch {
        await database.delete(accountTokens).where(eq(accountTokens.tokenHash, tokenHash(token)));
        return failure(
          context,
          500,
          "email_delivery_failed",
          "The password reset email could not be sent.",
        );
      }
    }
    return context.json({ requested: true });
  });

  app.post("/auth/password-reset/confirm", async (context) => {
    const parsed = resetConfirmationSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(
        context,
        400,
        "invalid_request",
        "A valid token and new password are required.",
      );
    const timestamp = now();
    const [record] = await database
      .select()
      .from(accountTokens)
      .where(
        and(
          eq(accountTokens.tokenHash, tokenHash(parsed.data.token)),
          eq(accountTokens.purpose, "reset_password"),
        ),
      )
      .limit(1);
    const email = await accountEmailForToken(database, record);
    if (await rateLimited(database, context, "password-reset-confirm", email, timestamp))
      return tooManyRequests(context);
    if (!record || record.expiresAt <= timestamp)
      return failure(context, 400, "invalid_token", "The reset token is invalid or expired.");
    await database
      .update(users)
      .set({
        passwordHash: await argon2.hash(parsed.data.password, { type: argon2.argon2id }),
        updatedAt: timestamp,
      })
      .where(eq(users.id, record.userId));
    await database
      .delete(accountTokens)
      .where(
        and(eq(accountTokens.userId, record.userId), eq(accountTokens.purpose, "reset_password")),
      );
    await database.delete(sessions).where(eq(sessions.userId, record.userId));
    return context.json({ reset: true });
  });

  app.get("/me", async (context) => {
    const authentication = await authenticate(database, context, now());
    if ("error" in authentication)
      return authenticationErrorResponse(context, authentication.error);
    const { user } = authentication;
    return context.json(profile(user));
  });

  app.patch("/me", async (context) => {
    const authentication = await authenticate(database, context, now());
    if ("error" in authentication)
      return authenticationErrorResponse(context, authentication.error);
    const { user } = authentication;
    const parsed = profileSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(context, 400, "invalid_request", "The profile update is invalid.");
    const updates = parsed.data;
    try {
      await database
        .update(users)
        .set({
          ...(updates.username !== undefined ? { username: updates.username } : {}),
          ...(updates.public_key !== undefined ? { publicKey: updates.public_key } : {}),
          ...(updates.private_key !== undefined ? { privateKey: updates.private_key } : {}),
          updatedAt: now(),
        })
        .where(eq(users.id, user.id));
    } catch {
      return failure(
        context,
        409,
        "profile_conflict",
        "A profile field conflicts with another account.",
      );
    }
    const [updated] = await database.select().from(users).where(eq(users.id, user.id)).limit(1);
    return context.json(profile(updated!));
  });

  // Token management is limited to browser sessions so an API token cannot mint or revoke tokens.
  async function sessionOwner(context: Context) {
    if (context.req.header("authorization") !== undefined) return null;
    return await sessionUser(database, context, now());
  }

  app.get("/me/tokens", async (context) => {
    const user = await sessionOwner(context);
    if (!user) return authenticationErrorResponse(context, "unauthenticated");
    const records = await database
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.userId, user.id))
      .orderBy(desc(apiTokens.createdAt));
    return context.json({ items: records.map(tokenView) });
  });

  app.post("/me/tokens", async (context) => {
    const user = await sessionOwner(context);
    if (!user) return authenticationErrorResponse(context, "unauthenticated");
    const parsed = tokenNameSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return failure(
        context,
        400,
        "invalid_request",
        "A token name of 1 to 100 characters is required.",
      );
    const secret = `ddf_${randomBytes(32).toString("base64url")}`;
    const record = {
      id: randomUUID(),
      userId: user.id,
      name: parsed.data.name,
      tokenHash: tokenHash(secret),
      tokenPrefix: secret.slice(0, 8),
      createdAt: now(),
    };
    await database.insert(apiTokens).values(record);
    const [created] = await database
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.id, record.id))
      .limit(1);
    return context.json({ ...tokenView(created!), secret }, 201);
  });

  app.delete("/me/tokens/:id", async (context) => {
    const user = await sessionOwner(context);
    if (!user) return authenticationErrorResponse(context, "unauthenticated");
    const [record] = await database
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, context.req.param("id")), eq(apiTokens.userId, user.id)))
      .limit(1);
    if (!record) return failure(context, 404, "token_not_found", "The API token does not exist.");
    await database
      .update(apiTokens)
      .set({ revokedAt: now() })
      .where(and(eq(apiTokens.id, record.id), isNull(apiTokens.revokedAt)));
    return context.body(null, 204);
  });

  app.get("/users/:id", async (context) => {
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.id, context.req.param("id")))
      .limit(1);
    if (!user) return failure(context, 404, "user_not_found", "The user does not exist.");
    return publicUserResponse(context, user);
  });

  app.get("/users", async (context) => {
    const key = context.req.query("public_key");
    if (!key) return failure(context, 404, "user_not_found", "The user does not exist.");
    const [user] = await database.select().from(users).where(eq(users.publicKey, key)).limit(1);
    if (!user) return failure(context, 404, "user_not_found", "The user does not exist.");
    return publicUserResponse(context, user);
  });
}
