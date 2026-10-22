import { afterEach, describe, expect, expectTypeOf, it } from "vite-plus/test";
import { createTestStore } from "../../../apps/store/test/support.js";
import {
  createStoreClient,
  downloadBundle,
  getBundle,
  getBundleVersions,
  searchBundles,
  StoreApiError,
  type BundleSummary,
  type ErrorCode,
  deprecateBundle,
  generateDdfUuids,
  signBundle,
  uploadBundles,
} from "../index.js";

const stores: Array<ReturnType<typeof createTestStore>> = [];

function recordingFetch(respond: (request: Request) => Response | Promise<Response>) {
  const requests: Request[] = [];
  const fetchImpl = (async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return await respond(request);
  }) as typeof fetch;
  return { requests, fetchImpl };
}

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

  it("reads bundle details and every version through typed routes", async () => {
    const { api, seedBundle } = setup();
    const uuid = "44444444-4444-4444-8444-444444444444";
    seedBundle({
      id: "older",
      ddf_uuid: uuid,
      source_last_modified: "2024-01-01T00:00:00.000Z",
    });
    seedBundle({
      id: "newer",
      ddf_uuid: uuid,
      source_last_modified: "2024-02-01T00:00:00.000Z",
    });

    const detail = await getBundle(api, "older");
    const versions = await getBundleVersions(api, "older");

    expect(detail).toMatchObject({ id: "older", ddf_uuid: uuid });
    expect(versions.items.map((item) => item.id)).toEqual(["newer", "older"]);
    expect(versions.total_count).toBe(2);
  });

  it("signs and deprecates a bundle through typed lifecycle operations", async () => {
    const { requests, fetchImpl } = recordingFetch((request) =>
      new URL(request.url).pathname.endsWith("/signatures")
        ? Response.json({
            success: true,
            state: "beta",
            signatures: [{ key: "beta-key", type: "system" }],
          })
        : Response.json({
            success: true,
            deprecation_message: null,
            signatures: [],
          }),
    );
    const client = createStoreClient({
      url: "https://store.test",
      token: "store-token",
      fetch: fetchImpl,
    });

    const signed = await signBundle(client, "bundle/one", "beta");
    const cleared = await deprecateBundle(client, "bundle/one", null);

    expect(new URL(requests[0]!.url).pathname).toBe("/v1/bundles/bundle%2Fone/signatures");
    expect(requests[0]!.method).toBe("POST");
    expect(await requests[0]!.json()).toEqual({ state: "beta" });
    expect(requests[1]!.method).toBe("POST");
    expect(await requests[1]!.json()).toEqual({ message: null });
    expect(signed).toMatchObject({ success: true, state: "beta" });
    expect(cleared).toMatchObject({ success: true, deprecation_message: null });
    expectTypeOf(signed.state).toEqualTypeOf<"alpha" | "beta" | "stable">();
  });

  it("converts lifecycle endpoint failures into typed store errors", async () => {
    const { fetchImpl } = recordingFetch(() =>
      Response.json(
        { error: { code: "contributor_required", message: "Only contributors can sign." } },
        { status: 403 },
      ),
    );
    const client = createStoreClient({ url: "https://store.test", fetch: fetchImpl });

    const error = await signBundle(client, "bundle-one", "stable").catch((caught) => caught);

    expect(error).toBeInstanceOf(StoreApiError);
    expect(error).toMatchObject({ status: 403, code: "contributor_required" });
    expectTypeOf<ErrorCode>().toEqualTypeOf<
      | "validation_error"
      | "bundle_not_found"
      | "bundle_forbidden"
      | "contributor_required"
      | "invalid_deprecation_message"
      | "system_signing_unavailable"
      | "system_key_invalid"
      | "signing_failed"
    >();
  });

  it("raises typed API errors", async () => {
    const { api } = setup();

    const error = await downloadBundle(api, "missing").catch((caught) => caught);

    expect(error).toBeInstanceOf(StoreApiError);
    expect(error).toMatchObject({ status: 404, code: "bundle_not_found" });
    expectTypeOf<ErrorCode>().toEqualTypeOf<
      | "validation_error"
      | "bundle_not_found"
      | "bundle_forbidden"
      | "contributor_required"
      | "invalid_deprecation_message"
      | "system_signing_unavailable"
      | "system_key_invalid"
      | "signing_failed"
    >();
  });

  it("raises validation errors for invalid queries", async () => {
    const { api } = setup();

    const error = await searchBundles(api, { page: "0" }).catch((caught) => caught);

    expect(error).toMatchObject({ status: 422, code: "validation_error" });
  });

  it("uploads multiple files and returns the typed per-file outcomes", async () => {
    const { requests, fetchImpl } = recordingFetch(() =>
      Response.json({
        results: [
          { file: "one.ddb", success: true, bundle_id: "bundle-one" },
          {
            file: "two.ddb",
            success: false,
            error: { code: "invalid_bundle", message: "Not a DDB file." },
          },
        ],
      }),
    );
    const client = createStoreClient({
      url: "https://store.test",
      token: "store-token",
      fetch: fetchImpl,
    });

    const result = await uploadBundles(client, [
      { name: "one.ddb", content: new Blob(["first"]) },
      { name: "two.ddb", content: new Blob(["second"]) },
    ]);

    expect(new URL(requests[0]!.url).pathname).toBe("/v1/bundles");
    expect(requests[0]!.method).toBe("POST");
    expect(requests[0]!.headers.get("authorization")).toBe("Bearer store-token");
    const body = await requests[0]!.formData();
    expect(body.get("state")).toBe("alpha");
    expect(body.getAll("files").map((file) => (file as File).name)).toEqual(["one.ddb", "two.ddb"]);
    expect(result.results).toMatchObject([
      { file: "one.ddb", success: true, bundle_id: "bundle-one" },
      { file: "two.ddb", success: false, error: { code: "invalid_bundle" } },
    ]);
  });

  it("generates owned DDF UUIDs through the versioned API", async () => {
    const { requests, fetchImpl } = recordingFetch(() =>
      Response.json({ uuid: ["new-uuid"], expire_at: "2030-01-22T00:00:00.000Z" }, { status: 201 }),
    );
    const client = createStoreClient({
      url: "https://store.test",
      token: "store-token",
      fetch: fetchImpl,
    });

    const result = await generateDdfUuids(client, 1);

    expect(new URL(requests[0]!.url).pathname).toBe("/v1/ddf-uuids");
    expect(requests[0]!.method).toBe("POST");
    expect(requests[0]!.headers.get("authorization")).toBe("Bearer store-token");
    expect(await requests[0]!.json()).toEqual({ count: 1 });
    expect(result).toEqual({ uuid: ["new-uuid"], expire_at: "2030-01-22T00:00:00.000Z" });
  });

  it("converts upload request errors into typed StoreApiErrors", async () => {
    const { fetchImpl } = recordingFetch(() =>
      Response.json(
        { error: { code: "validation_error", message: "A multipart form is required." } },
        { status: 422 },
      ),
    );
    const client = createStoreClient({ url: "https://store.test", fetch: fetchImpl });

    const error = await uploadBundles(
      client,
      [{ name: "one.ddb", content: new Blob(["bundle"]) }],
      "beta",
    ).catch((caught) => caught);

    expect(error).toBeInstanceOf(StoreApiError);
    expect(error).toMatchObject({ status: 422, code: "validation_error" });
  });

  it("batches uploads above the service's per-request file limit", async () => {
    const { requests, fetchImpl } = recordingFetch(async (request) => {
      const form = await request.formData();
      return Response.json({
        results: form.getAll("files").map((file) => ({
          file: (file as File).name,
          success: true,
          bundle_id: "bundle",
        })),
      });
    });
    const client = createStoreClient({ url: "https://store.test", fetch: fetchImpl });

    const result = await uploadBundles(
      client,
      Array.from({ length: 101 }, (_, index) => ({
        name: `bundle-${index}.ddb`,
        content: new Blob(["bundle"]),
      })),
    );

    expect(requests).toHaveLength(2);
    expect(result.results).toHaveLength(101);
    expect(result.results[100]?.file).toBe("bundle-100.ddb");
  });
});
