import { describe, expect, it } from "vitest";
import { availableUsername, generateUsername } from "../src/auth/username.js";

describe("usernames", () => {
  it("generates readable placeholder names", () => {
    expect(generateUsername()).toMatch(/^User #[0-9A-F]{4}$/);
    expect(generateUsername(8)).toMatch(/^User #[0-9A-F]{8}$/);
  });

  it("keeps a free preferred name and replaces a taken or empty one", () => {
    const taken = new Set(["Ada Example"]);
    expect(availableUsername((name) => taken.has(name), "Grace")).toBe("Grace");
    expect(availableUsername((name) => taken.has(name), "Ada Example")).toMatch(/^User #/);
    expect(availableUsername((name) => taken.has(name), "")).toMatch(/^User #/);
  });

  it("lengthens the generated suffix when the short space is exhausted", () => {
    expect(availableUsername((name) => /^User #[0-9A-F]{4}$/.test(name))).toMatch(
      /^User #[0-9A-F]{8}$/,
    );
  });

  it("gives up instead of looping forever when every name is taken", () => {
    let calls = 0;
    expect(() =>
      availableUsername(() => {
        calls++;
        return true;
      }, "Ada"),
    ).toThrow(/No available username/);
    expect(calls).toBe(101);
  });
});
