import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const gridSize = 6;

/** Retro-like symmetric 8-bit sprite, derived only from the key. */
export function retroAvatar(seed: string, size = 80): string {
  const hash = sha256(new TextEncoder().encode(seed || bytesToHex(new Uint8Array(32))));
  const hue = Math.round(((hash[0]! << 8) | hash[1]!) % 360);
  const foreground = `hsl(${hue},65%,50%)`;
  const background = `hsl(${(hue + 180) % 360},45%,85%)`;
  const half = gridSize / 2;
  let cells = "";
  let bit = 16;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < half; x++) {
      const on = ((hash[2 + (bit >> 3)]! >> (bit & 7)) & 1) === 1;
      bit++;
      if (!on) continue;
      cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      cells += `<rect x="${gridSize - 1 - x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${gridSize} ${gridSize}" shape-rendering="crispEdges">` +
    `<rect width="${gridSize}" height="${gridSize}" fill="${background}"/>` +
    `<g fill="${foreground}">${cells}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
