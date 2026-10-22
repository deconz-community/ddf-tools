import { reactive } from "vue";
import type { CreatedStoreApiToken, StoreApiToken } from "@deconz-community/store-api-client";

export interface TokenApi {
  listTokens(): Promise<StoreApiToken[]>;
  createToken(name: string): Promise<CreatedStoreApiToken>;
  revokeToken(id: string): Promise<void>;
}

export interface TokenManagerState {
  tokens: StoreApiToken[];
  revealedSecret?: { name: string; secret: string };
  error: string;
}

export function createTokenManager(api: TokenApi) {
  const state = reactive<TokenManagerState>({ tokens: [], error: "" });

  async function refresh() {
    try {
      state.tokens = await api.listTokens();
    } catch {
      state.error = "The tokens could not be loaded.";
    }
  }

  async function create(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      state.error = "Enter a name for the token.";
      return;
    }
    try {
      const { secret, ...token } = await api.createToken(trimmed);
      state.error = "";
      state.revealedSecret = { name: token.name, secret };
      await refresh();
    } catch {
      state.error = "The token could not be created.";
    }
  }

  async function revoke(id: string) {
    try {
      await api.revokeToken(id);
      state.error = "";
      await refresh();
    } catch {
      state.error = "The token could not be revoked.";
    }
  }

  function dismissSecret() {
    state.revealedSecret = undefined;
  }

  return { state, refresh, create, revoke, dismissSecret };
}
