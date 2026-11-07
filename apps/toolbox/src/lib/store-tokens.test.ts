import { describe, expect, it } from "vite-plus/test";
import type { CreatedStoreApiToken, StoreApiToken } from "@deconz-community/store-api-client";
import { createTokenManager, type TokenApi } from "./store-tokens";

function fakeApi() {
  const tokens: StoreApiToken[] = [];
  const api: TokenApi = {
    listTokens: async () => tokens.map((token) => ({ ...token })),
    createToken: async (name) => {
      const created: CreatedStoreApiToken = {
        id: `id-${tokens.length + 1}`,
        name,
        prefix: "ddf_abcd",
        date_created: "2026-01-01T00:00:00.000Z",
        last_used: null,
        revoked: false,
        secret: `ddf_secret-${tokens.length + 1}`,
      };
      const { secret: _secret, ...view } = created;
      tokens.push(view);
      return created;
    },
    revokeToken: async (id) => {
      const token = tokens.find((item) => item.id === id);
      if (!token) throw new Error("missing");
      token.revoked = true;
    },
  };
  return api;
}

describe("token manager", () => {
  it("reveals the secret once after creation and refreshes the list", async () => {
    const manager = createTokenManager(fakeApi());
    await manager.refresh();
    expect(manager.state.tokens).toEqual([]);

    await manager.create("  laptop  ");
    expect(manager.state.revealedSecret).toEqual({ name: "laptop", secret: "ddf_secret-1" });
    expect(manager.state.tokens.map((token) => token.name)).toEqual(["laptop"]);
    expect(JSON.stringify(manager.state.tokens)).not.toContain("ddf_secret-1");

    manager.dismissSecret();
    expect(manager.state.revealedSecret).toBeUndefined();
    await manager.refresh();
    expect(manager.state.revealedSecret).toBeUndefined();
  });

  it("revokes a token and reports failures without losing state", async () => {
    const manager = createTokenManager(fakeApi());
    await manager.create("ci");
    await manager.revoke("id-1");
    expect(manager.state.tokens[0]?.revoked).toBe(true);

    await manager.revoke("nope");
    expect(manager.state.error).toBe("The token could not be revoked.");
    expect(manager.state.tokens).toHaveLength(1);
  });

  it("rejects blank names without calling the API", async () => {
    const manager = createTokenManager(fakeApi());
    await manager.create("   ");
    expect(manager.state.error).toBe("Enter a name for the token.");
    expect(manager.state.tokens).toEqual([]);
  });
});
