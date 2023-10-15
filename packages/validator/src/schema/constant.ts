import { z } from 'zod'
import type { GenericsData } from '../types'

export function constantsSchema1(_generics: GenericsData) {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('constants1.schema.json'),
    'ddfvalidate': z.optional(z.boolean()),
    'manufacturers': z.record(z.string().startsWith('$MF_'), z.string()),
    'device-types': z.record(z.string().startsWith('$TYPE_'), z.string()),
  })
}

export function constantsSchema2(_generics: GenericsData) {
  return z.object({
    $schema: z.optional(z.string()),
    schema: z.literal('constants2.schema.json'),
    ddfvalidate: z.optional(z.boolean()),
  }).passthrough()
}
