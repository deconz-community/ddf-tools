import { z } from 'zod'
import type { GenericsData } from '../types'
import * as cf from '../custom-formats'

export function subDeviceSchema(generics: GenericsData) {
  return z.strictObject({
    $schema: z.optional(z.string()),
    schema: z.literal('subdevice1.schema.json'),
    type: z.enum(Object.keys(generics.deviceTypes) as [string, ...string[]]),
    name: z.enum(Object.values(generics.deviceTypes) as [string, ...string[]]),
    restapi: z.enum(['/lights', '/sensors']),
    order: z.number(),
    uuid: cf.uuid(),
    items: z.array(z.enum(generics.attributes as [string, ...string[]])),
  })
}
