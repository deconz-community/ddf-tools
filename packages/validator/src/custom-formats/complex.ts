import { z } from 'zod'
import { hexa } from './strings'

export function flatNumberStringTupleInArray() {
  return z.custom((arr: unknown) => {
    if (!Array.isArray(arr))
      return false

    if (arr.length % 2 !== 0)
      return false

    for (let i = 0; i < arr.length; i += 2) {
      const num = arr[i]
      const str = arr[i + 1]

      if (typeof num !== 'number' || typeof str !== 'string')
        return false
    }

    return true
  }, 'The value must be an array with an even number of values and alternating between number and string.')
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
