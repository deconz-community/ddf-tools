import { z } from 'zod'

export function hexa(digit = 2) {
  // TODO implement to accept only hexa values in string
  // Example : '0x01'
  return z.string().length(2 + digit)
}

export function javascript() {
  return z.string()
}

export function endpoint() {
  return z.union([
    hexa(2),
    z.number().min(0).max(255),
  ])
}

export function filePath() {
  return z.string()
}

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
