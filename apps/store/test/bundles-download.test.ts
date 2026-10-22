import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createTestStore } from "./support.js";

const stores: Array<ReturnType<typeof createTestStore>> = [];

function setup() {
  const store = createTestStore();
  stores.push(store);
  return store;
}

afterEach(() => {
  for (const store of stores.splice(0)) store.client.close();
});

const realBundle = readFileSync(
  resolve(import.meta.dirname, "../../../packages/bundler/test/ddb/starkvind_air_purifier.ddb"),
);

describe("GET /v1/bundles/:id/download", () => {
  it("returns the stored DDB bytes unchanged to an anonymous visitor", async () => {
    const { app, seedBundle } = setup();
    const { id } = seedBundle({ product: "Starkvind", content: realBundle });

    const response = await app.request("/v1/bundles/" + id + "/download");

    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer()).equals(realBundle)).toBe(true);
  });

  it("preserves arbitrary binary content", async () => {
    const { app, seedBundle } = setup();
    const content = Buffer.from(Array.from({ length: 256 }, (_, index) => index));
    const { id } = seedBundle({ content });

    const response = await app.request("/v1/bundles/" + id + "/download");

    expect(Buffer.from(await response.arrayBuffer()).equals(content)).toBe(true);
  });

  it("sets immutable cache and download headers", async () => {
    const { app, seedBundle } = setup();
    const { id } = seedBundle({ product: "Starkvind Air", content: realBundle });

    const response = await app.request("/v1/bundles/" + id + "/download");

    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("content-type")).toBe("application/x-deconz-ddf-bundle");
    expect(response.headers.get("content-length")).toBe(String(realBundle.length));
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename=starkvind-air-[\w-]+\.ddb$/,
    );
  });

  it("allows downloading deprecated bundles", async () => {
    const { app, seedBundle } = setup();
    const { id } = seedBundle({ deprecation_message: "Replaced by a newer bundle" });

    expect((await app.request("/v1/bundles/" + id + "/download")).status).toBe(200);
  });

  it("returns a typed not-found error for an unknown bundle", async () => {
    const { app } = setup();

    const response = await app.request("/v1/bundles/missing/download");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "bundle_not_found", message: "Bundle missing was not found" },
    });
  });
});
