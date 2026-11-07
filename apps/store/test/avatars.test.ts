import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { readImageInfo } from "../src/auth/avatars.js";

function png(width: number, height: number) {
  const data = new Uint8Array(33);
  data.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(data.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return data;
}

function jpeg(width: number, height: number) {
  const data = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0, 0, 0, 0, 1, 1, 0x11, 0,
  ]);
  const view = new DataView(data.buffer);
  view.setUint16(13, height);
  view.setUint16(15, width);
  return data;
}

describe("avatar image inspection", () => {
  it("reads PNG and JPEG dimensions", () => {
    expect(readImageInfo(png(64, 64))).toEqual({ extension: "png", width: 64, height: 64 });
    expect(readImageInfo(jpeg(80, 80))).toEqual({ extension: "jpg", width: 80, height: 80 });
    expect(readImageInfo(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("avatar upload route", () => {
  it("rejects unauthenticated uploads", async () => {
    const { createApp } = await import("../src/http/app.js");
    const Database = (await import("better-sqlite3")).default;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const schema = await import("../src/db/schema.js");
    const { runMigrations } = await import("../src/db/database.js");
    const client = new Database(":memory:");
    const database = drizzle(client, { schema });
    runMigrations(database);
    const directory = mkdtempSync(join(tmpdir(), "avatars-"));
    const app = createApp(database, { avatarPath: directory });
    const form = new FormData();
    form.set("file", new Blob([png(64, 64)], { type: "image/png" }), "a.png");
    const response = await app.request("/v1/me/avatar", {
      method: "POST",
      headers: { authorization: "Bearer nope" },
      body: form,
    });
    expect(response.status).toBe(401);
    expect(existsSync(join(directory, "key.png"))).toBe(false);
    expect((await app.request("/v1/avatars/missing")).status).toBe(404);
    client.close();
  });
});
