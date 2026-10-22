import { describe, expect, it } from "vite-plus/test";
import {
  createToolboxStoreClient,
  downloadStoreBundle,
  searchStoreBundles,
  storeBundleDownloadUrl,
} from "./store-api";

function recordingFetch(respond: (request: Request) => Response) {
  const requests: Request[] = [];
  const fetchImpl = (async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return respond(request);
  }) as typeof fetch;
  return { requests, fetchImpl };
}

describe("toolbox store API helpers", () => {
  it("searches through the typed client using snake_case query parameters", async () => {
    const { requests, fetchImpl } = recordingFetch(() =>
      Response.json({ items: [], total_count: 0, page: 2, limit: 5 }),
    );
    const client = createToolboxStoreClient("https://store.test/", fetchImpl);

    const result = await searchStoreBundles(client, {
      page: 2,
      limit: 5,
      product: "hue",
      hasKey: "abc",
      showDeprecated: true,
    });

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe("/v1/bundles");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "2",
      limit: "5",
      product: "hue",
      has_key: "abc",
      show_deprecated: "true",
    });
    expect(result.total_count).toBe(0);
  });

  it("downloads bundle bytes through the typed client", async () => {
    const bytes = new Uint8Array([0, 128, 255]);
    const { requests, fetchImpl } = recordingFetch(() => new Response(bytes));
    const client = createToolboxStoreClient("https://store.test/", fetchImpl);

    const blob = await downloadStoreBundle(client, "bundle-id");

    expect(new URL(requests[0].url).pathname).toBe("/v1/bundles/bundle-id/download");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });

  it("builds a direct download link", () => {
    expect(storeBundleDownloadUrl("https://store.test/", "abc")).toBe(
      "https://store.test/v1/bundles/abc/download",
    );
  });
});
