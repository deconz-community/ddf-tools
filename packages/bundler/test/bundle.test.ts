import { readFile } from "node:fs/promises";

import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { describe, expect, it } from "vite-plus/test";
import { Bundle, decode, encode, getHash, sign, verifySignature } from "../index";

describe("tests", () => {
  it("should verify both existing signatures", async () => {
    const data = await readFile(new URL("./ddb/starkvind_air_purifier.ddb", import.meta.url));
    const blob = new Blob([data]);
    // @ts-expect-error ts(2540)
    blob.name = "starkvind_air_purifier";
    const bundle = await decode(blob);

    expect(bundle.data.signatures).toHaveLength(2);
    expect(bundle.data.hash).toBeDefined();

    const validSignatures = await Promise.all(
      bundle.data.signatures.map(({ key, signature }) =>
        verifySignature(bundle.data.hash!, key, signature),
      ),
    );
    expect(validSignatures).toEqual([true, true]);
  });

  it("should detect an invalid signature and re-sign the bundle", async () => {
    const data = await readFile(
      new URL("./ddb/starkvind_air_purifier_invalid_signature.ddb", import.meta.url),
    );
    const bundle = await decode(new Blob([data]));

    expect(bundle.data.signatures.length).toBeGreaterThan(0);
    const results = await Promise.all(
      bundle.data.signatures.map(({ key, signature }) =>
        verifySignature(bundle.data.hash!, key, signature),
      ),
    );
    expect(results).toContain(false);

    bundle.data.signatures = [];
    const privateKey = hexToBytes("b9a40d177b44c782fc77272f31608246531919f159b0d21a8dac964d9989d655");
    const signed = await decode(await sign(encode(bundle), [{ key: privateKey }]));

    expect(signed.data.signatures).toHaveLength(1);
    const [{ key, signature }] = signed.data.signatures;
    expect(await verifySignature(signed.data.hash!, key, signature)).toBe(true);
    expect(bytesToHex(signature)).toEqual(
      "c0c7315c0e5baaad2175562bd72722023444388abcd062361de63dbbc58911a355e0d48b9e13ee747ec1cc7cb8e03b9064614df85f5a6de0efecd2bcdf674317"
    );
  });

  it("should parse without errors", async () => {
    const data = await readFile(new URL("./ddb/starkvind_air_purifier.ddb", import.meta.url));
    const expectedFileHash = "558ba98d7950596af6d70c8a0030d63ca3554535cba44c00b21b078d9fe3eb2e";
    const expectedHash = "7b0f8504eb36d76a694920ddbc789a849b61b9aa9fceab169905468392466226";
    const blob = new Blob([data]);

    expect(bytesToHex(await getHash(new Uint8Array(data)))).toEqual(expectedFileHash);
    // @ts-expect-error ts(2540)
    blob.name = "starkvind_air_purifier";
    const bundle = await decode(blob);
    expect(bundle.data.hash).toBeDefined();
    expect(bytesToHex(bundle.data.hash!)).toEqual(expectedHash);

    expect(bundle.data.name).toEqual("starkvind_air_purifier");
    expect(bundle.data.desc.product).toEqual("Starkvind Air purifier (E2006/E2007)");
    expect(bundle.data.files.length).toEqual(36);

    const genericAttributes = bundle.data.files.find(
      (file) => file.path === "generic/items/attr_id_item.json",
    );
    expect(genericAttributes).toBeDefined();
    expect(genericAttributes?.last_modified).toBeDefined();

    const genericConstants = bundle.data.files.find(
      (file) => file.path === "generic/constants_min.json",
    );
    expect(genericConstants).toBeDefined();
    expect(genericConstants?.last_modified).toEqual(new Date("2023-09-16T13:26:26.000Z"));

    bundle.data.hash = undefined;
    const encoded = encode(bundle);
    const newHash = await getHash(new Uint8Array(await encoded.arrayBuffer()));
    expect(bytesToHex(newHash)).toEqual(expectedFileHash);
  });

  it("should bundle", async () => {
    const bundle = Bundle();

    const fixedDate = new Date("2023-04-27T18:34:00");

    bundle.data.desc.last_modified = fixedDate;
    bundle.data.name = "sample";
    bundle.data.files = [
      {
        type: "DDFC",
        data: JSON.stringify({
          schema: "devcap1.schema.json",
        }),
        path: "ddf.json",
        last_modified: fixedDate,
      },
      {
        type: "JSON",
        data: JSON.stringify({ foo: "bar" }),
        path: "foo.json",
        last_modified: fixedDate,
      },
    ];

    bundle.generateDESC();

    const encoded = encode(bundle);
    const newHash = await getHash(new Uint8Array(await encoded.arrayBuffer()));
    expect(bytesToHex(newHash)).toEqual(
      "0e015a4f4efc5e68d1230edad93a84ca1acad0375f0f08e904c576f1a30aaa17",
    );
  });

  it("should use the correct date", async () => {
    const bundle = Bundle();

    const fixedOldDate = new Date("2001-04-27T18:34:00");
    const fixedDate = new Date("2023-04-27T18:34:00");

    bundle.data.name = "sample";
    bundle.data.files = [
      {
        type: "DDFC",
        data: JSON.stringify({
          schema: "devcap1.schema.json",
        }),
        path: "ddf.json",
        last_modified: fixedOldDate,
      },
      {
        type: "JSON",
        data: JSON.stringify({ foo: "bar" }),
        path: "foo.json",
        last_modified: fixedDate,
      },
    ];

    bundle.generateDESC();
    const encoded = encode(bundle);
    const decoded = await decode(encoded);

    expect(decoded.data.desc.last_modified).toEqual(fixedDate);
  });
});
