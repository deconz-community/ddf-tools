import { z } from 'zod'
import type { GenericsData } from '../types'

export function constantsSchema(_generics: GenericsData) {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('constants1.schema.json'),
    'manufacturers': z.record(z.string().startsWith('$MF_'), z.string()),
    'device-types': z.record(z.string().startsWith('$TYPE_'), z.string()),
  })
}
