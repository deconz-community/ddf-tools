import {
  BETA_PUBLIC_KEY,
  DEPRECATED_PUBLIC_KEY,
  STABLE_PUBLIC_KEY,
} from "@deconz-community/ddf-bundler";
import type { AccountOptions } from "../auth/accounts.js";

export function systemPublicKeys(options: AccountOptions) {
  return {
    beta: options.systemSigningKeys?.beta?.publicKey?.toLowerCase() ?? BETA_PUBLIC_KEY,
    stable: options.systemSigningKeys?.stable?.publicKey?.toLowerCase() ?? STABLE_PUBLIC_KEY,
    deprecated:
      options.systemSigningKeys?.deprecated?.publicKey?.toLowerCase() ?? DEPRECATED_PUBLIC_KEY,
  };
}
