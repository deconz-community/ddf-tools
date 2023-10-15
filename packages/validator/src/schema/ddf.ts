import type { ZodIssueOptionalMessage } from 'zod'
import { z } from 'zod'
import type { GenericsData } from '../types'
import * as cf from '../custom-formats'
import { resourceSchema } from './resource'

export function ddfSchema(generics: GenericsData) {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('devcap1.schema.json'),
    'uuid': z.optional(z.string()),
    'ddfvalidate': z.optional(z.boolean()),
    'version': z.optional(z.string()),
    'version_deconz': z.optional(z.string()),
    'doc:path': z.optional(z.string()),
    'doc:hdr': z.optional(z.string()),
    'md:known_issues': z.optional(z.array(z.string())).describe('Know issues for this device, markdown file.'),
    'manufacturername': z.union([
      z.enum(Object.keys(generics.manufacturers) as [string, ...string[]]),
      z.string().regex(/^(?!\$MF_).*/g, 'The manufacturer name start with $MF_ but is not present in constants.json'),
      z.array(
        z.union([
          z.enum(Object.keys(generics.manufacturers) as [string, ...string[]]),
          z.string().regex(/^(?!\$MF_).*/g, 'The manufacturer name start with $MF_ but is not present in constants.json'),
        ]),
      ),
    ]).describe('Manufacturer name from Basic Cluster.'),
    'modelid': z.string().or(z.array(z.string())).describe('Model ID from Basic Cluster.'),
    'vendor': z.optional(z.string()).describe('Friendly name of the manufacturer.'),
    'comment': z.optional(z.string()),
    'matchexpr': z.optional(cf.javascript()).describe('Need to return true for the DDF be used.'),
    'path': z.optional(cf.filePath()).describe('DDF path, useless, can be removed.'),
    'product': z.optional(z.string()).describe('Complements the model id to be shown in the UI.'),
    'sleeper': z.optional(z.boolean()).describe('Sleeping devices can only receive when awake.'),
    'supportsMgmtBind': z.optional(z.boolean()),
    'status': z.enum(['Draft', 'Bronze', 'Silver', 'Gold']).describe('The code quality of the DDF file.'),
    'subdevices': z.array(ddfSubDeviceSchema(generics)).describe('Devices section.'),
    'bindings': z.optional(z.array(ddfBindingSchema(generics))).describe('Bindings section.'),
  })
}

export function ddfSubDeviceSchema(generics: GenericsData) {
  return z.strictObject({
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
    restapi: z.enum(['/lights', '/sensors']),
    uuid: cf.uuid(),
    fingerprint: z.optional(z.strictObject({
      profile: cf.hexa(4),
      device: cf.hexa(4),
      endpoint: cf.endpoint(),
      in: z.optional(z.array(cf.hexa(4))),
      out: z.optional(z.array(cf.hexa(4))),
    })),
    meta: z.optional(z.strictObject({
      // TODO validate this
      'values': z.any(),
      'group.endpoints': z.optional(z.array(z.number())),
    })),
    // TODO validate this
    buttons: z.optional(z.any()),
    // TODO validate this
    buttonevents: z.optional(z.any()),
    items: z.array(subDeviceItemSchema(generics)),
    example: z.optional(z.unknown()),
  })
}

export function subDeviceItemSchema(generics: GenericsData) {
  return resourceSchema(generics)
    .omit({
      $schema: true,
      schema: true,
      id: true,
    })
    .extend({
      name: z.enum(generics.attributes as [string, ...string[]], {
        errorMap: (issue: ZodIssueOptionalMessage, ctx: { defaultError: string }) => {
          if (issue.code === 'invalid_enum_value')
            return { message: `Invalid enum value. Expected item from generic attributes definition, received '${issue.received}'` }
          return { message: ctx.defaultError }
        },
      })
        .describe('Item name.'),
    })
}

export function ddfBindingSchema(_generics: GenericsData) {
  return z.discriminatedUnion('bind', [
    z.strictObject({
      'bind': z.literal('unicast'),
      'src.ep': cf.endpoint().describe('Source endpoint.'),
      'dst.ep': z.optional(cf.endpoint()).describe('Destination endpoint, generaly 0x01.'),
      'cl': cf.hexa(4).describe('Cluster.'),
      'report': z.optional(z.array(
        z.strictObject({
          at: cf.hexa(4),
          dt: cf.hexa(2),
          mf: z.optional(cf.hexa(4)),
          min: z.number(),
          max: z.number(),
          change: z.optional(cf.hexa().or(z.number())),
        }).refine(data => data.min <= data.max, { message: 'invalid report time, min should be smaller than max' }),
      )),
    }),
    z.strictObject({
      'bind': z.literal('groupcast'),
      'src.ep': cf.endpoint().describe('Source endpoint.'),
      'cl': cf.hexa(4).describe('Cluster.'),
      'config.group': z.number().min(0).max(255),
    }),
  ])
}
