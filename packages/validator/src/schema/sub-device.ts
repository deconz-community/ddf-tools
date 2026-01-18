import type { GenericsData } from '../types'
import { z } from 'zod'
import * as cf from '../custom-formats'

export function subDeviceSchema(generics: GenericsData) {
  const items = z.array(
    z.enum(generics.attributes, {
      error: (issue) => {
        if (issue.code === 'invalid_value')
          return `Invalid enum value. Expected item from generic attributes definition, received '${issue.input}'`
        return issue.message
      },
    }),
  )

  return z.strictObject({
    $schema: z.optional(z.string()),
    schema: z.literal('subdevice1.schema.json'),
    ddfvalidate: z.optional(z.boolean()),
    type: z.union([
      z.enum(Object.keys(generics.deviceTypes), {
        error: (issue) => {
          if (issue.code === 'invalid_value')
            return `Invalid enum value. Expected type from generic attributes definition, received '${issue.input}'`
          return issue.message
        },
      }),
      z.string().regex(/^(?!\$TYPE_).*/g, 'The type start with $TYPE_ but is not present in constants.json'),
    ]),
    name: z.string(),
    ui_name: z.string().max(64),
    restapi: z.enum(['/lights', '/sensors']),
    order: z.number(),
    uuid: cf.uuid(),
    items,
    items_optional: z.optional(items),
  })
}
