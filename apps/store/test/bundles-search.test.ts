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

describe("GET /v1/bundles", () => {
  it("returns the agreed response shape for an anonymous visitor", async () => {
    const { app, seedBundle } = setup();
    const { id, ddf_uuid } = seedBundle({
      vendor: "IKEA",
      product: "Starkvind",
      version_deconz: "2.28.0",
      info: "An air purifier",
      source_last_modified: "2024-03-01T10:00:00.000Z",
      devices: [{ manufacturer: "IKEA of Sweden", model: "STARKVIND" }],
      signatures: [{ key: "abc", type: "system" }],
    });

    const response = await app.request("/v1/bundles");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      items: [
        {
          id,
          ddf_uuid,
          vendor: "IKEA",
          product: "Starkvind",
          version_deconz: "2.28.0",
          info: "An air purifier",
          source_last_modified: "2024-03-01T10:00:00.000Z",
          content_hash: `hash-${id}`,
          deprecation_message: null,
          device_identifiers: [{ manufacturer: "IKEA of Sweden", model: "STARKVIND" }],
          signatures: [{ key: "abc", type: "system" }],
        },
      ],
      total_count: 1,
      page: 1,
      limit: 20,
    });
  });

  it("returns an empty page when the store has no bundles", async () => {
    const { app } = setup();

    const response = await app.request("/v1/bundles");

    expect(await response.json()).toEqual({ items: [], total_count: 0, page: 1, limit: 20 });
  });

  it("returns only the latest bundle of each DDF UUID", async () => {
    const { app, seedBundle } = setup();
    const uuid = "11111111-1111-4111-8111-111111111111";
    seedBundle({ id: "old", ddf_uuid: uuid, source_last_modified: "2024-01-01T00:00:00.000Z" });
    seedBundle({ id: "new", ddf_uuid: uuid, source_last_modified: "2024-02-01T00:00:00.000Z" });
    seedBundle({ id: "other", source_last_modified: "2023-01-01T00:00:00.000Z" });

    const body = await (await app.request("/v1/bundles")).json();

    expect(body.items.map((item: { id: string }) => item.id)).toEqual(["new", "other"]);
    expect(body.total_count).toBe(2);
  });

  it("breaks source modification ties with the creation time", async () => {
    const { app, seedBundle } = setup();
    const uuid = "22222222-2222-4222-8222-222222222222";
    const modified = "2024-01-01T00:00:00.000Z";
    seedBundle({
      id: "created-late",
      ddf_uuid: uuid,
      source_last_modified: modified,
      date_created: "2024-05-02T00:00:00.000Z",
    });
    seedBundle({
      id: "created-early",
      ddf_uuid: uuid,
      source_last_modified: modified,
      date_created: "2024-05-01T00:00:00.000Z",
    });

    const body = await (await app.request("/v1/bundles")).json();

    expect(body.items.map((item: { id: string }) => item.id)).toEqual(["created-late"]);
  });

  it("filters by vendor, product, manufacturer and model", async () => {
    const { app, seedBundle } = setup();
    seedBundle({
      id: "a",
      vendor: "IKEA",
      product: "Starkvind",
      devices: [{ manufacturer: "IKEA of Sweden", model: "STARKVIND Air purifier" }],
    });
    seedBundle({
      id: "b",
      vendor: "Philips",
      product: "Hue bulb",
      devices: [{ manufacturer: "Signify Netherlands B.V.", model: "LCT015" }],
    });

    const ids = async (query: string) =>
      (await (await app.request(`/v1/bundles?${query}`)).json()).items.map(
        (item: { id: string }) => item.id,
      );

    expect(await ids("vendor=ikea")).toEqual(["a"]);
    expect(await ids("product=hue")).toEqual(["b"]);
    expect(await ids("manufacturer=signify")).toEqual(["b"]);
    expect(await ids("model=starkvind")).toEqual(["a"]);
    expect(await ids("manufacturer=ikea&model=LCT015")).toEqual([]);
    expect(await ids("vendor=%25")).toEqual([]);
  });

  it("filters by key presence", async () => {
    const { app, seedBundle } = setup();
    seedBundle({ id: "signed", signatures: [{ key: "stable-key", type: "system" }] });
    seedBundle({ id: "unsigned", signatures: [{ key: "other", type: "user" }] });

    const body = await (await app.request("/v1/bundles?has_key=stable-key")).json();

    expect(body.items.map((item: { id: string }) => item.id)).toEqual(["signed"]);
    expect(body.total_count).toBe(1);
  });

  it("hides deprecated bundles unless show_deprecated is true", async () => {
    const { app, seedBundle } = setup();
    seedBundle({ id: "ok" });
    seedBundle({ id: "deprecated", deprecation_message: "Replaced by something else" });

    const hidden = await (await app.request("/v1/bundles")).json();
    const shown = await (await app.request("/v1/bundles?show_deprecated=true")).json();

    expect(hidden.items.map((item: { id: string }) => item.id)).toEqual(["ok"]);
    expect(shown.items.map((item: { id: string }) => item.id).sort()).toEqual(["deprecated", "ok"]);
    expect(shown.total_count).toBe(2);
  });

  it("paginates newest first with a total count", async () => {
    const { app, seedBundle } = setup();
    for (let day = 1; day <= 5; day++) {
      seedBundle({ id: `bundle-${day}`, source_last_modified: `2024-01-0${day}T00:00:00.000Z` });
    }

    const second = await (await app.request("/v1/bundles?page=2&limit=2")).json();

    expect(second.items.map((item: { id: string }) => item.id)).toEqual(["bundle-3", "bundle-2"]);
    expect(second).toMatchObject({ total_count: 5, page: 2, limit: 2 });
  });

  it("caps the page size at 20", async () => {
    const { app, seedBundle } = setup();
    for (let index = 0; index < 25; index++) seedBundle();

    const body = await (await app.request("/v1/bundles?limit=100")).json();

    expect(body.items).toHaveLength(20);
    expect(body).toMatchObject({ total_count: 25, limit: 20 });
  });

  it("rejects invalid pagination with a typed validation error", async () => {
    const { app } = setup();

    const response = await app.request("/v1/bundles?page=0");

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("validation_error");
  });
});
