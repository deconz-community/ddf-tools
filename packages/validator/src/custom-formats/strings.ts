import { z } from 'zod'

export function date() {
  return z.string()
}

export function hexa(digit: number | undefined = undefined) {
  // TODO implement to accept only hexa values in string
  if (digit === undefined)
    return z.string()
  // Example : '0x01'
  return z.string().length(2 + digit)
}

export function endpoint() {
  return z.union([
    hexa(2),
    z.number().min(0).max(255),
  ])
}

export function uuid() {
  return z.union([
    z.tuple([
      z.literal('$address.ext'),
      hexa(2),
    ]),
    z.tuple([
      z.literal('$address.ext'),
      hexa(2),
      hexa(4),
    ]),
  ])
}
