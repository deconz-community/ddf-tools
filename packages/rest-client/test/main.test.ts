import { describe, expect, it } from "vite-plus/test";
import { generateAPIKey, generatePinCode } from "../src/core/helpers";
import { endpoints } from "../src/gateway/endpoints";

describe("generateAPIKey", () => {
  it("returns an uppercase hex key", () => {
    expect(generateAPIKey()).toMatch(/^[0-9A-F]{32}$/);
  });

  it("returns a different key on each call", () => {
    expect(generateAPIKey()).not.toBe(generateAPIKey());
  });
});

describe("generatePinCode", () => {
  it("returns an 8 digit code by default", () => {
    expect(generatePinCode()).toMatch(/^\d{8}$/);
  });

  it("returns a code of the requested length", () => {
    expect(generatePinCode(4)).toMatch(/^\d{4}$/);
  });
});

describe("createAPIKey", () => {
  it("has a sample accepted by its own body schema", () => {
    const { body } = endpoints.createAPIKey.parameters;
    const sample = typeof body.sample === "function" ? body.sample() : body.sample;

    expect(body.schema.safeParse(sample).success).toBe(true);
  });
});
