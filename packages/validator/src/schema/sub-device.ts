import type { ZodIssueOptionalMessage } from 'zod'
import { z } from 'zod'
import type { GenericsData } from '../types'
import * as cf from '../custom-formats'

export function subDeviceSchema(generics: GenericsData) {
  const items = z.array(
    z.enum(generics.attributes as [string, ...string[]], {
      errorMap: (issue: ZodIssueOptionalMessage, ctx: { defaultError: string }) => {
        if (issue.code === 'invalid_enum_value')
          return { message: `Invalid enum value. Expected item from generic attributes definition, received '${issue.received}'` }
        return { message: ctx.defaultError }
      },
    }),
  )

  return z.strictObject({
    $schema: z.optional(z.string()),
    schema: z.literal('subdevice1.schema.json'),
    ddfvalidate: z.optional(z.boolean()),
    type: z.union([
      z.enum(Object.keys(generics.deviceTypes) as [string, ...string[]], {
        errorMap: (issue: ZodIssueOptionalMessage, ctx: { defaultError: string }) => {
          if (issue.code === 'invalid_enum_value')
            return { message: `Invalid enum value. Expected type from generic attributes definition, received '${issue.received}'` }
          return { message: ctx.defaultError }
        },
      }),
      z.string().regex(/^(?!\$TYPE_).*/g, 'The type start with $TYPE_ but is not present in constants.json'),
    ]),
    name: z.string(),
    restapi: z.enum(['/lights', '/sensors']),
    order: z.number(),
    uuid: cf.uuid(),
    items,
    items_optional: z.optional(items),
  })
}
