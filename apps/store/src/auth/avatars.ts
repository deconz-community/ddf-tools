import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Hono, type Context } from "hono";
import type { StoreDatabase } from "../db/database.js";
import { authenticateStoreRequest, authenticationErrorResponse } from "./accounts.js";
import type { AccountOptions } from "./accounts.js";

export const avatarMinSize = 40;
export const avatarMaxSize = 200;
export const avatarMaxBytes = 512 * 1024;

const extensions = ["png", "jpg"] as const;
type AvatarExtension = (typeof extensions)[number];
const contentTypes: Record<AvatarExtension, string> = { png: "image/png", jpg: "image/jpeg" };
const idPattern = /^[\w-]{1,128}$/;

export interface ImageInfo {
  extension: AvatarExtension;
  width: number;
  height: number;
}

export function readImageInfo(data: Uint8Array): ImageInfo | null {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (data.length >= 24 && pngSignature.every((byte, index) => data[index] === byte)) {
    if (String.fromCharCode(...data.subarray(12, 16)) !== "IHDR") return null;
    return { extension: "png", width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= data.length) {
      if (data[offset] !== 0xff) return null;
      const marker = data[offset + 1]!;
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = view.getUint16(offset + 2);
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        if (offset + 9 > data.length) return null;
        return {
          extension: "jpg",
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }
  return null;
}

function failure(
  context: Context,
  status: 400 | 404 | 413 | 422 | 503,
  code: string,
  message: string,
) {
  return context.json({ error: { code, message } }, status);
}

export function avatarRoutes(database: StoreDatabase, options: AccountOptions): Hono {
  const app = new Hono();
  const now = options.now ?? Date.now;

  async function removeAvatars(directory: string, id: string) {
    await Promise.all(
      extensions.map((extension) => rm(join(directory, `${id}.${extension}`), { force: true })),
    );
  }

  app.post("/me/avatar", async (context) => {
    const authentication = await authenticateStoreRequest(database, context, now());
    if ("error" in authentication)
      return authenticationErrorResponse(context, authentication.error);
    const directory = options.avatarPath;
    if (!directory)
      return failure(context, 503, "avatars_unavailable", "Avatar storage is not configured.");

    const { id } = authentication.user;
    if (!idPattern.test(id))
      return failure(context, 422, "invalid_user", "The user id cannot be used as a file name.");

    const declaredLength = Number(context.req.header("content-length") ?? 0);
    if (declaredLength > avatarMaxBytes + 4096)
      return failure(context, 413, "avatar_too_large", "The avatar file is too large.");

    const body = await context.req.parseBody().catch(() => null);
    const file = body?.file;
    if (!(file instanceof File))
      return failure(context, 400, "invalid_request", "A file field is required.");
    if (file.size > avatarMaxBytes)
      return failure(context, 413, "avatar_too_large", "The avatar file is too large.");

    const data = new Uint8Array(await file.arrayBuffer());
    const info = readImageInfo(data);
    if (!info)
      return failure(context, 422, "invalid_image", "The file must be a valid PNG or JPEG image.");
    if (info.width !== info.height || info.width < avatarMinSize || info.width > avatarMaxSize)
      return failure(
        context,
        422,
        "invalid_image_size",
        `The image must be square, between ${avatarMinSize} and ${avatarMaxSize} pixels.`,
      );

    await mkdir(directory, { recursive: true });
    await removeAvatars(directory, id);
    const temporary = join(directory, `.${randomUUID()}.tmp`);
    await writeFile(temporary, data);
    await rename(temporary, join(directory, `${id}.${info.extension}`));
    return context.json({ id, content_type: contentTypes[info.extension] }, 201);
  });

  app.delete("/me/avatar", async (context) => {
    const authentication = await authenticateStoreRequest(database, context, now());
    if ("error" in authentication)
      return authenticationErrorResponse(context, authentication.error);
    const { id } = authentication.user;
    if (options.avatarPath && idPattern.test(id)) await removeAvatars(options.avatarPath, id);
    return context.body(null, 204);
  });

  app.get("/avatars/:id", async (context) => {
    const id = context.req.param("id");
    if (!options.avatarPath || !idPattern.test(id))
      return failure(context, 404, "avatar_not_found", "The avatar does not exist.");
    for (const extension of extensions) {
      try {
        const data = await readFile(join(options.avatarPath, `${id}.${extension}`));
        context.header("Content-Type", contentTypes[extension]);
        context.header("Cache-Control", "public, max-age=300");
        context.header("X-Content-Type-Options", "nosniff");
        return context.body(data);
      } catch {
        // try the next extension
      }
    }
    return failure(context, 404, "avatar_not_found", "The avatar does not exist.");
  });

  return app;
}
