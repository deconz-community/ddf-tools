import { randomBytes } from "node:crypto";

/** Placeholder username for accounts that did not choose one, e.g. "User #A3F9". */
export function generateUsername(length = 4): string {
  return `User #${randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
    .toUpperCase()}`;
}

/** Returns `preferred` when it is free, otherwise a generated username that is not taken. */
export function availableUsername(isTaken: (username: string) => boolean, preferred?: string) {
  if (preferred && !isTaken(preferred)) return preferred;
  // Four hex digits are enough in practice; lengthen the suffix if the short space is crowded.
  for (let attempt = 0; ; attempt++) {
    const candidate = generateUsername(attempt < 20 ? 4 : 8);
    if (!isTaken(candidate)) return candidate;
  }
}

/** Whether a database error is a UNIQUE violation on the given column (e.g. "users.username"). */
export function isUniqueViolation(error: unknown, column: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if (current.message.includes("UNIQUE constraint failed") && current.message.includes(column)) {
      return true;
    }
  }
  return false;
}
