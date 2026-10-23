import { createHash } from "node:crypto";

export function avatarHash(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
