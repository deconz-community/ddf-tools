import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { and, eq } from "drizzle-orm";
import { Hono, type Context } from "hono";
import {
  decode,
  encode,
  generateHash,
  verifySignature,
  createSignature,
  BETA_PUBLIC_KEY,
  STABLE_PUBLIC_KEY,
} from "@deconz-community/ddf-bundler";
import { randomUUID } from "node:crypto";
import type { AccountOptions, StoreAuthentication } from "./accounts.js";
import { authenticateStoreRequest } from "./accounts.js";
import type { StoreDatabase } from "./database.js";
import {
  bundles,
  bundlesDeviceIdentifiers,
  ddfUuids,
  deviceIdentifiers,
  signatures,
} from "./schema.js";

type UploadState = "alpha" | "beta" | "stable";
type FileResult =
  | { file: string; success: true; bundle_id: string }
  | { file: string; success: false; error: { code: string; message: string } };

class UploadError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const stateSchema = ["alpha", "beta", "stable"] as const;
const systemPublicKeys = { beta: BETA_PUBLIC_KEY, stable: STABLE_PUBLIC_KEY };

function authError(
  context: Context,
  authentication: Extract<StoreAuthentication, { error: string }>,
) {
  const messages = {
    unauthenticated: "Sign in to continue.",
    invalid_api_token: "The API token is invalid.",
    token_revoked: "The API token has been revoked.",
  };
  return context.json(
    { error: { code: authentication.error, message: messages[authentication.error] } },
    401,
  );
}

function stateKey(
  options: AccountOptions,
  state: Exclude<UploadState, "alpha">,
): { publicKey: string; privateKey: Uint8Array } | undefined {
  const configured = options.systemSigningKeys?.[state];
  if (!configured) return undefined;
  const publicKey = configured.publicKey ?? systemPublicKeys[state];
  const privateKey = hexToBytes(configured.privateKey);
  if (bytesToHex(secp256k1.getPublicKey(privateKey)) !== publicKey.toLowerCase()) {
    throw new UploadError("system_key_invalid", `The configured ${state} signing key is invalid.`);
  }
  return { publicKey: publicKey.toLowerCase(), privateKey };
}

function parseState(value: FormDataEntryValue | null): UploadState {
  const state = typeof value === "string" && value.length > 0 ? value : "alpha";
  if (!(stateSchema as readonly string[]).includes(state)) {
    throw new UploadError("invalid_state", "state must be alpha, beta, or stable.");
  }
  return state as UploadState;
}

function publicKeyForUser(authentication: Extract<StoreAuthentication, { user: unknown }>) {
  const { publicKey, privateKey } = authentication.user;
  if (!publicKey || !privateKey) {
    throw new UploadError(
      "uploader_keypair_missing",
      "Set up a public and private signing key in your profile before uploading.",
    );
  }
  let derivedKey: string;
  let privateKeyBytes: Uint8Array;
  try {
    privateKeyBytes = hexToBytes(privateKey);
    derivedKey = bytesToHex(secp256k1.getPublicKey(privateKeyBytes));
  } catch {
    throw new UploadError("uploader_keypair_invalid", "The uploader signing key is invalid.");
  }
  if (derivedKey !== publicKey.toLowerCase()) {
    throw new UploadError(
      "uploader_keypair_mismatch",
      "The public key does not match the private key in the uploader profile.",
    );
  }
  return { publicKey: derivedKey, privateKey: privateKeyBytes };
}

function fileFailure(file: string, code: string, message: string): FileResult {
  return { file, success: false, error: { code, message } };
}

async function processFile(
  database: StoreDatabase,
  options: AccountOptions,
  user: Extract<StoreAuthentication, { user: unknown }>["user"],
  state: UploadState,
  file: File,
  uploaderKey: { publicKey: string; privateKey: Uint8Array },
  serverKey?: { publicKey: string; privateKey: Uint8Array },
): Promise<FileResult> {
  try {
    const bundle = await decode(file);
    if (!bundle.data.hash) {
      throw new UploadError("invalid_bundle", "The bundle does not contain a valid DDFB hash.");
    }

    const originalHash = bytesToHex(bundle.data.hash);
    const originalDesc = JSON.stringify({
      ...bundle.data.desc,
      last_modified:
        bundle.data.desc.last_modified instanceof Date
          ? bundle.data.desc.last_modified.toISOString()
          : bundle.data.desc.last_modified,
    });
    bundle.generateDESC();
    bundle.data.hash = await generateHash(bundle.data);
    if (originalHash !== bytesToHex(bundle.data.hash)) {
      throw new UploadError(
        "invalid_desc",
        "The DESC does not match the bundle files. Rebuild the bundle with the latest bundler.",
      );
    }
    const regeneratedDesc = JSON.stringify({
      ...bundle.data.desc,
      last_modified:
        bundle.data.desc.last_modified instanceof Date
          ? bundle.data.desc.last_modified.toISOString()
          : bundle.data.desc.last_modified,
    });
    if (originalDesc !== regeneratedDesc) {
      throw new UploadError("invalid_desc", "The DESC does not match the bundle files.");
    }
    if (!bundle.data.desc.uuid) {
      throw new UploadError("missing_uuid", "The bundle is missing a DDF UUID.");
    }
    if (!bundle.data.desc.version_deconz) {
      throw new UploadError(
        "missing_version_deconz",
        "The bundle is missing a supported deCONZ version.",
      );
    }

    const systemKeys = {
      beta: options.systemSigningKeys?.beta?.publicKey?.toLowerCase() ?? systemPublicKeys.beta,
      stable:
        options.systemSigningKeys?.stable?.publicKey?.toLowerCase() ?? systemPublicKeys.stable,
    };
    const removeKeys =
      state === "alpha"
        ? [systemKeys.beta, systemKeys.stable]
        : state === "beta"
          ? [systemKeys.stable]
          : [systemKeys.beta];
    let dirty = false;
    const signaturesToKeep = bundle.data.signatures.filter(
      (signature) => !removeKeys.includes(bytesToHex(signature.key)),
    );
    if (signaturesToKeep.length !== bundle.data.signatures.length) {
      bundle.data.signatures = signaturesToKeep;
      dirty = true;
    }

    const expectedKeys = [uploaderKey, ...(serverKey ? [serverKey] : [])];
    for (const expected of expectedKeys) {
      if (
        !bundle.data.signatures.some(
          (signature) => bytesToHex(signature.key) === expected.publicKey,
        )
      ) {
        bundle.data.signatures.push({
          key: hexToBytes(expected.publicKey),
          signature: createSignature(bundle.data.hash, expected.privateKey),
        });
        dirty = true;
      }
    }

    const signatureKeys = bundle.data.signatures.map((signature) => bytesToHex(signature.key));
    if (new Set(signatureKeys).size !== signatureKeys.length) {
      throw new UploadError("duplicate_signature", "The bundle contains duplicate signatures.");
    }
    const signatureChecks = await Promise.all(
      bundle.data.signatures.map((signature) =>
        verifySignature(bundle.data.hash!, signature.key, signature.signature),
      ),
    );
    if (signatureChecks.includes(false)) {
      throw new UploadError("invalid_signature", "The bundle contains an invalid signature.");
    }

    const content = Buffer.from(await (dirty ? encode(bundle) : file).arrayBuffer());
    const bundleId = originalHash;
    const contentHash = bytesToHex(sha256(new Uint8Array(content)));
    const existing = database
      .select()
      .from(ddfUuids)
      .where(eq(ddfUuids.id, bundle.data.desc.uuid))
      .get();
    const timestamp = options.now?.() ?? Date.now();
    if (existing) {
      const hasPublishedBundle = database
        .select({ id: bundles.id })
        .from(bundles)
        .where(eq(bundles.ddf_uuid, existing.id))
        .limit(1)
        .get();
      const expired = existing.expire_at !== null && Date.parse(existing.expire_at) <= timestamp;
      if (expired && !hasPublishedBundle) {
        database
          .update(ddfUuids)
          .set({ owner_id: user.id, expire_at: null })
          .where(eq(ddfUuids.id, existing.id))
          .run();
      } else if (existing.owner_id !== user.id && !user.isContributor) {
        throw new UploadError("uuid_forbidden", "You do not own this DDF UUID.");
      }
    } else {
      database
        .insert(ddfUuids)
        .values({
          id: bundle.data.desc.uuid,
          date_created: new Date(timestamp).toISOString(),
          expire_at: null,
          owner_id: user.id,
        })
        .run();
    }

    if (database.select().from(bundles).where(eq(bundles.id, bundleId)).get()) {
      throw new UploadError(
        "bundle_hash_already_exists",
        "A bundle with the same hash already exists.",
      );
    }

    database.transaction((transaction) => {
      transaction
        .insert(bundles)
        .values({
          id: bundleId,
          ddf_uuid: bundle.data.desc.uuid,
          date_created: new Date(timestamp).toISOString(),
          source_last_modified: bundle.data.desc.last_modified.toISOString(),
          vendor: bundle.data.desc.vendor || "Unknown vendor",
          product: bundle.data.desc.product || "Unknown product",
          version_deconz: bundle.data.desc.version_deconz,
          info:
            bundle.data.files
              .filter((item) => item.type === "INFO")
              .map((item) => item.path)
              .join("\n") || null,
          content,
          content_size: content.length,
          file_count: bundle.data.files.length,
          content_hash: contentHash,
        })
        .run();

      for (const [manufacturer, model] of bundle.data.desc.device_identifiers) {
        transaction
          .insert(deviceIdentifiers)
          .values({ id: randomUUID(), manufacturer, model })
          .onConflictDoNothing({
            target: [deviceIdentifiers.manufacturer, deviceIdentifiers.model],
          })
          .run();
        const identifier = transaction
          .select()
          .from(deviceIdentifiers)
          .where(
            and(
              eq(deviceIdentifiers.manufacturer, manufacturer),
              eq(deviceIdentifiers.model, model),
            ),
          )
          .get();
        if (identifier) {
          transaction
            .insert(bundlesDeviceIdentifiers)
            .values({ bundles_id: bundleId, device_identifiers_id: identifier.id })
            .run();
        }
      }

      for (const signature of bundle.data.signatures) {
        const key = bytesToHex(signature.key);
        const type = Object.values(systemKeys).includes(key) ? "system" : "user";
        transaction
          .insert(signatures)
          .values({ id: randomUUID(), key, bundle: bundleId, type })
          .run();
      }
    });
    return { file: file.name, success: true, bundle_id: bundleId };
  } catch (error) {
    if (error instanceof UploadError) return fileFailure(file.name, error.code, error.message);
    if (error instanceof Error) return fileFailure(file.name, "invalid_bundle", error.message);
    return fileFailure(file.name, "invalid_bundle", "The uploaded bundle is invalid.");
  }
}

export function bundleUploadRoutes(database: StoreDatabase, options: AccountOptions) {
  return new Hono().post("/bundles", async (context) => {
    const authentication = await authenticateStoreRequest(
      database,
      context,
      options.now?.() ?? Date.now(),
    );
    if ("error" in authentication) return authError(context, authentication);

    let form: FormData;
    try {
      form = await context.req.formData();
    } catch {
      return context.json(
        { error: { code: "validation_error", message: "A multipart form is required." } },
        422,
      );
    }
    let state: UploadState;
    try {
      state = parseState(form.get("state"));
    } catch (error) {
      const reason = error instanceof UploadError ? error.message : "Invalid upload state.";
      return context.json({ error: { code: "validation_error", message: reason } }, 422);
    }
    const files = form.getAll("files").filter((value): value is File => value instanceof File);
    if (files.length === 0 || files.length > 100) {
      return context.json(
        {
          error: { code: "validation_error", message: "Upload between one and one hundred files." },
        },
        422,
      );
    }

    let uploaderKey: { publicKey: string; privateKey: Uint8Array } | undefined;
    let keyError: UploadError | undefined;
    try {
      uploaderKey = publicKeyForUser(authentication);
    } catch (error) {
      keyError =
        error instanceof UploadError
          ? error
          : new UploadError("uploader_keypair_invalid", "The uploader signing key is invalid.");
    }

    let serverKey: { publicKey: string; privateKey: Uint8Array } | undefined;
    let stateError: UploadError | undefined;
    if (state !== "alpha") {
      if (!authentication.user.isContributor) {
        stateError = new UploadError(
          "contributor_required",
          "Only contributors can publish beta or stable bundles.",
        );
      } else {
        try {
          serverKey = stateKey(options, state);
          if (!serverKey) {
            stateError = new UploadError(
              "system_signing_unavailable",
              `The server is missing the ${state} signing key.`,
            );
          }
        } catch (error) {
          stateError =
            error instanceof UploadError
              ? error
              : new UploadError("system_key_invalid", "The system signing key is invalid.");
        }
      }
    }

    const results = await Promise.all(
      files.map(async (file): Promise<FileResult> => {
        const error = keyError ?? stateError;
        if (error) return fileFailure(file.name, error.code, error.message);
        return processFile(
          database,
          options,
          authentication.user,
          state,
          file,
          uploaderKey!,
          serverKey,
        );
      }),
    );
    return context.json({ results });
  });
}
