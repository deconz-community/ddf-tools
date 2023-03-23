import { z } from 'zod'

export function filePath() {
  return z.string()
}

export function javascript() {
  // TODO make a better validator
  return z.string()
}
