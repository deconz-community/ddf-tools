import { afterEach, describe, expect, expectTypeOf, it } from "vite-plus/test";
import { createTestStore } from "../../../apps/store/test/support.js";
import {
  createStoreClient,
  downloadBundle,
  searchBundles,
  StoreApiError,
  type BundleSummary,
  type ErrorCode,
} from "../index.js";

const stores: Array<ReturnType<typeof createTestStore>> = [];

function setup() {
  const store = createTestStore();
  stores.push(store);
  const client = createStoreClient({
    url: "http://store.test",
    fetch: (async (input, init) => store.app.fetch(new Request(input, init))) as typeof fetch,
  });
  return { ...store, api: client };
}

afterEach(() => {
  for (const store of stores.splice(0)) store.client.close();
});

describe("store client", () => {
  it("searches bundles with typed snake_case filters", async () => {
    const { api, seedBundle } = setup();
    const { id } = seedBundle({ vendor: "IKEA", devices: [{ manufacturer: "IKEA", model: "X" }] });
    seedBundle({ vendor: "Other" });

    const result = await searchBundles(api, { vendor: "ikea", page: "1", limit: "5" });

    expect(result.items.map((item) => item.id)).toEqual([id]);
    expect(result).toMatchObject({ total_count: 1, page: 1, limit: 5 });
    expectTypeOf(result.items[0]).toEqualTypeOf<BundleSummary>();
    expectTypeOf(result.total_count).toBeNumber();
    expectTypeOf(result.items[0].device_identifiers).toEqualTypeOf<
      Array<{ manufacturer: string; model: string }>
    >();
    expectTypeOf<BundleSummary["signatures"][number]["type"]>().toEqualTypeOf<"system" | "user">();
  });

  it("downloads the original bytes", async () => {
    const { api, seedBundle } = setup();
    const content = Buffer.from([0, 255, 1, 254, 2]);
    const { id } = seedBundle({ content });

    const blob = await downloadBundle(api, id);

    expect(Buffer.from(await blob.arrayBuffer()).equals(content)).toBe(true);
  });

  it("raises typed API errors", async () => {
    const { api } = setup();

    const error = await downloadBundle(api, "missing").catch((caught) => caught);

    expect(error).toBeInstanceOf(StoreApiError);
    expect(error).toMatchObject({ status: 404, code: "bundle_not_found" });
    expectTypeOf<ErrorCode>().toEqualTypeOf<"validation_error" | "bundle_not_found">();
  });

  it("raises validation errors for invalid queries", async () => {
    const { api } = setup();

    const error = await searchBundles(api, { page: "0" }).catch((caught) => caught);

    expect(error).toMatchObject({ status: 422, code: "validation_error" });
  });
});
