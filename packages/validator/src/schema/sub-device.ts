import { z } from 'zod'
import type { GenericsData } from '../types'
import * as cf from '../custom-formats'

export function subDeviceSchema(generics: GenericsData) {
  return z.strictObject({
    $schema: z.optional(z.string()),
    schema: z.literal('subdevice1.schema.json'),
    type: z.union([
      z.enum(Object.keys(generics.deviceTypes) as [string, ...string[]]),
      z.string().regex(/^(?!\$TYPE_).*/g, 'The type start with $TYPE_ but is not present in constants.json'),
    ]),
    name: z.string(),
    restapi: z.enum(['/lights', '/sensors']),
    order: z.number(),
    uuid: cf.uuid(),
    items: z.array(z.enum(generics.attributes as [string, ...string[]])),
    items_optional: z.optional(z.array(z.enum(generics.attributes as [string, ...string[]]))),
  })
}
