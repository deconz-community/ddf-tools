import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { eq } from "drizzle-orm";
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  BETA_PUBLIC_KEY,
  DEPRECATED_PUBLIC_KEY,
  STABLE_PUBLIC_KEY,
  createSignature,
  decode,
  encode,
  verifySignature,
} from "@deconz-community/ddf-bundler";
import { randomUUID } from "node:crypto";
import type { AccountOptions, SigningKey } from "../auth/accounts.js";
import { authenticateStoreRequest, authenticationErrorResponse } from "../auth/accounts.js";
import type { StoreDatabase } from "../db/database.js";
import { errorResponse } from "../http/errors.js";
import { bundles, ddfUuids, signatures } from "../db/schema.js";
import { systemPublicKeys } from "./system-keys.js";

const signatureRequestSchema = z.object({ state: z.enum(["alpha", "beta", "stable"]) }).strict();
const deprecationRequestSchema = z
  .object({ message: z.union([z.string().min(10), z.null()]) })
  .strict();

type LifecycleSignatureState = z.infer<typeof signatureRequestSchema>["state"];
type LifecycleEnvironment = {
  Variables: { lifecycleUser: { id: string; isContributor: boolean } };
};

function configuredSigningKey(
  options: AccountOptions,
  kind: "beta" | "stable" | "deprecated",
): SigningKey | undefined {
  const configured = options.systemSigningKeys?.[kind];
  if (!configured) return undefined;
  const defaultPublicKey =
    kind === "beta"
      ? BETA_PUBLIC_KEY
      : kind === "stable"
        ? STABLE_PUBLIC_KEY
        : DEPRECATED_PUBLIC_KEY;
  const publicKey = (configured.publicKey ?? defaultPublicKey).toLowerCase();
  let privateKey: Uint8Array;
  try {
    privateKey = hexToBytes(configured.privateKey);
    if (bytesToHex(secp256k1.getPublicKey(privateKey)) !== publicKey) throw new Error();
  } catch {
    throw new Error(`The configured ${kind} signing key is invalid.`);
  }
  return { publicKey, privateKey };
}

function signatureType(key: string, options: AccountOptions): "system" | "user" {
  return Object.values(systemPublicKeys(options)).includes(key.toLowerCase()) ? "system" : "user";
}

async function authenticate(context: Context, database: StoreDatabase, options: AccountOptions) {
  const authentication = await authenticateStoreRequest(
    database,
    context,
    options.now?.() ?? Date.now(),
  );
  return "error" in authentication
    ? authenticationErrorResponse(context, authentication.error)
    : authentication;
}

function invalidBundle(context: Context) {
  return errorResponse(context, 422, "signing_failed", "The stored bundle could not be updated.");
}

function requireAuthentication(
  database: StoreDatabase,
  options: AccountOptions,
): MiddlewareHandler<LifecycleEnvironment> {
  return async (context, next) => {
    const authentication = await authenticate(context, database, options);
    if (authentication instanceof Response) return authentication;
    context.set("lifecycleUser", {
      id: authentication.user.id,
      isContributor: authentication.user.isContributor,
    });
    await next();
  };
}

const requireContributor: MiddlewareHandler<LifecycleEnvironment> = async (context, next) => {
  if (!context.get("lifecycleUser").isContributor) {
    return errorResponse(
      context,
      403,
      "contributor_required",
      "Only contributors can change system bundle signatures.",
    );
  }
  await next();
};

function persistBundle(
  database: StoreDatabase,
  bundleId: string,
  decoded: Awaited<ReturnType<typeof decode>>,
  options: AccountOptions,
  changes?: { deprecation_message: string | null },
) {
  const contentBlob = encode(decoded);
  return contentBlob.arrayBuffer().then((arrayBuffer) => {
    const content = Buffer.from(arrayBuffer);
    const contentHash = bytesToHex(sha256(new Uint8Array(content)));
    const rows = decoded.data.signatures.map((signature) => {
      const key = bytesToHex(signature.key);
      return { id: randomUUID(), bundle: bundleId, key, type: signatureType(key, options) };
    });
    database.transaction((transaction) => {
      transaction
        .update(bundles)
        .set({ content, content_size: content.length, content_hash: contentHash, ...changes })
        .where(eq(bundles.id, bundleId))
        .run();
      transaction.delete(signatures).where(eq(signatures.bundle, bundleId)).run();
      if (rows.length) transaction.insert(signatures).values(rows).run();
    });
    return rows.map(({ key, type }) => ({ key, type }));
  });
}

async function decodeStoredBundle(content: Buffer, bundleId: string) {
  const decoded = await decode(new Blob([new Uint8Array(content)]));
  if (!decoded.data.hash || bytesToHex(decoded.data.hash) !== bundleId) {
    throw new Error("The stored bundle hash does not match its ID.");
  }
  const validity = await Promise.all(
    decoded.data.signatures.map((signature) =>
      verifySignature(decoded.data.hash!, signature.key, signature.signature),
    ),
  );
  if (validity.includes(false)) throw new Error("The stored bundle has an invalid signature.");
  return decoded;
}

function signState(
  decoded: Awaited<ReturnType<typeof decode>>,
  state: LifecycleSignatureState,
  options: AccountOptions,
) {
  const systemKeys = systemPublicKeys(options);
  decoded.data.signatures = decoded.data.signatures.filter((signature) => {
    const key = bytesToHex(signature.key).toLowerCase();
    return (
      key !== systemKeys.beta &&
      key !== systemKeys.stable &&
      key !== BETA_PUBLIC_KEY &&
      key !== STABLE_PUBLIC_KEY
    );
  });
  if (state !== "alpha") {
    const key = configuredSigningKey(options, state);
    if (!key) throw new Error(`The server is missing the ${state} signing key.`);
    decoded.data.signatures.push({
      key: hexToBytes(key.publicKey),
      signature: createSignature(decoded.data.hash!, key.privateKey),
    });
  }
}

function setDeprecationSignature(
  decoded: Awaited<ReturnType<typeof decode>>,
  message: string | null,
  options: AccountOptions,
) {
  const configuredPublicKey = systemPublicKeys(options).deprecated;
  const keysToReplace = new Set([configuredPublicKey, DEPRECATED_PUBLIC_KEY]);
  decoded.data.signatures = decoded.data.signatures.filter(
    (signature) => !keysToReplace.has(bytesToHex(signature.key).toLowerCase()),
  );
  if (message !== null) {
    const key = configuredSigningKey(options, "deprecated");
    if (!key) throw new Error("The server is missing the deprecated signing key.");
    decoded.data.signatures.push({
      key: hexToBytes(key.publicKey),
      signature: createSignature(decoded.data.hash!, key.privateKey),
    });
  }
}

export function bundleLifecycleRoutes(database: StoreDatabase, options: AccountOptions) {
  const authentication = requireAuthentication(database, options);
  return new Hono<LifecycleEnvironment>()
    .post(
      "/bundles/:id/signatures",
      authentication,
      requireContributor,
      zValidator("json", signatureRequestSchema, (result, context) => {
        if (!result.success) {
          return errorResponse(
            context,
            422,
            "validation_error",
            "State must be alpha, beta, or stable.",
          );
        }
      }),
      async (context) => {
        const parsed = context.req.valid("json");

        const bundleId = context.req.param("id");
        const [record] = await database
          .select({ content: bundles.content })
          .from(bundles)
          .where(eq(bundles.id, bundleId))
          .limit(1);
        if (!record)
          return errorResponse(
            context,
            404,
            "bundle_not_found",
            `Bundle ${bundleId} was not found.`,
          );

        try {
          const decoded = await decodeStoredBundle(record.content, bundleId);
          signState(decoded, parsed.state, options);
          const updatedSignatures = await persistBundle(database, bundleId, decoded, options);
          return context.json({
            success: true,
            state: parsed.state,
            signatures: updatedSignatures,
          });
        } catch (error) {
          if (error instanceof Error && /missing .*signing key/i.test(error.message)) {
            return errorResponse(context, 503, "system_signing_unavailable", error.message);
          }
          if (
            error instanceof Error &&
            /configured .*signing key is invalid/i.test(error.message)
          ) {
            return errorResponse(context, 503, "system_key_invalid", error.message);
          }
          return invalidBundle(context);
        }
      },
    )
    .post(
      "/bundles/:id/deprecate",
      authentication,
      zValidator("json", deprecationRequestSchema, (result, context) => {
        if (!result.success) {
          const shortMessage = result.error.issues.some(
            (issue) => issue.path[0] === "message" && issue.code === "too_small",
          );
          return shortMessage
            ? errorResponse(
                context,
                422,
                "invalid_deprecation_message",
                "A deprecation message must contain at least 10 characters.",
              )
            : errorResponse(
                context,
                422,
                "validation_error",
                "Provide a deprecation message or null.",
              );
        }
      }),
      async (context) => {
        const parsed = context.req.valid("json");
        const user = context.get("lifecycleUser");

        const bundleId = context.req.param("id");
        const [record] = await database
          .select({ content: bundles.content, ownerId: ddfUuids.owner_id })
          .from(bundles)
          .leftJoin(ddfUuids, eq(ddfUuids.id, bundles.ddf_uuid))
          .where(eq(bundles.id, bundleId))
          .limit(1);
        if (!record)
          return errorResponse(
            context,
            404,
            "bundle_not_found",
            `Bundle ${bundleId} was not found.`,
          );
        if (!user.isContributor && record.ownerId !== user.id) {
          return errorResponse(
            context,
            403,
            "bundle_forbidden",
            "Only the bundle owner or a contributor can change its deprecation.",
          );
        }

        try {
          const decoded = await decodeStoredBundle(record.content, bundleId);
          setDeprecationSignature(decoded, parsed.message, options);
          const updatedSignatures = await persistBundle(database, bundleId, decoded, options, {
            deprecation_message: parsed.message,
          });
          return context.json({
            success: true,
            deprecation_message: parsed.message,
            signatures: updatedSignatures,
          });
        } catch (error) {
          if (error instanceof Error && /missing .*signing key/i.test(error.message)) {
            return errorResponse(context, 503, "system_signing_unavailable", error.message);
          }
          if (
            error instanceof Error &&
            /configured .*signing key is invalid/i.test(error.message)
          ) {
            return errorResponse(context, 503, "system_key_invalid", error.message);
          }
          return invalidBundle(context);
        }
      },
    );
}
