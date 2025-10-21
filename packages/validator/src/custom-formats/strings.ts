import { z } from 'zod'

export function date() {
  return z.string().regex(
    // Regex for AAAA-MM-JJ
    /^(\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
    'Invalid date value',
  )
}

export function hexa(digit: number | undefined = undefined) {
  const message = 'Invalid hexadecimal value'
  if (digit === undefined)
    return z.string().regex(/^0x[0-9a-fA-F]+$/, message)
  // Example : '0x01'
  return z.string().regex(new RegExp(`^0x[0-9a-fA-F]{${digit}}$`), message)
}

export function endpoint() {
  return z.union([
    hexa(2),
    z.number().min(0).max(255),
  ])
}
