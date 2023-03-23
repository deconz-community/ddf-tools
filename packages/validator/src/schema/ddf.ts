import { z } from 'zod'
import type { GenericsData } from '../types'
import * as cf from '../custom-formats'
import { parseFunction, readFunction, writeFunction } from './function'

export function ddfSchema(generics: GenericsData) {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('devcap1.schema.json'),
    'doc:path': z.optional(z.string()),
    'doc:hdr': z.optional(z.string()),
    'md:known_issues': z.optional(z.array(z.string())),
    'manufacturername': z.string().or(z.array(z.string())),
    'modelid': z.string().or(z.array(z.string())),
    'vendor': z.optional(z.string()),
    'comment': z.optional(z.string()),
    'matchexpr': z.optional(cf.javascript()),
    'path': z.optional(cf.filePath()),
    'product': z.optional(z.string()),
    'sleeper': z.optional(z.boolean()),
    'supportsMgmtBind': z.optional(z.boolean()),
    'status': z.enum(['Draft', 'Bronze', 'Silver', 'Gold']).describe('The code quality of the DDF file.'),
    'subdevices': z.array(ddfSubDeviceSchema(generics)),
    'bindings': z.optional(z.array(ddfBindingSchema(generics))),
  }).refine((data) => {
    return (
      typeof data.manufacturername === 'string'
        && typeof data.modelid === 'string'
    )
      || (
        Array.isArray(data.manufacturername)
        && Array.isArray(data.modelid)
        && data.manufacturername.length === data.modelid.length
      )
  }, {
    message: 'manufacturername and modelid should be both strings or arrays with the same length.',
    path: ['manufacturername', 'modelid'],
  }).innerType()
}

export function ddfSubDeviceSchema(generics: GenericsData) {
  return z.strictObject({
    type: z.union([
      z.enum(Object.keys(generics.deviceTypes) as [string, ...string[]]),
      z.enum(Object.values(generics.deviceTypes) as [string, ...string[]]),
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
  return z.strictObject({
    'name': z.enum(generics.attributes as [string, ...string[]]),
    'description': z.optional(z.string()),
    'comment': z.optional(z.string()),
    'public': z.optional(z.boolean()),
    'static': z.optional(z.union([z.string(), z.number(), z.boolean()])),
    'range': z.optional(z.tuple([z.number(), z.number()])),
    'deprecated': z.optional(cf.date()),
    'access': z.optional(z.literal('R')),
    'read': z.optional(readFunction()),
    'parse': z.optional(parseFunction()),
    'write': z.optional(writeFunction()),
    'awake': z.optional(z.boolean()),
    'default': z.optional(z.unknown()),
    'values': z.optional(z.unknown()),
    'refresh.interval': z.optional(z.number()),
  })
}

export function ddfBindingSchema(_generics: GenericsData) {
  return z.discriminatedUnion('bind', [
    z.strictObject({
      'bind': z.literal('unicast'),
      'src.ep': cf.endpoint(),
      'dst.ep': z.optional(cf.endpoint()),
      'cl': cf.hexa(4),
      'report': z.optional(z.array(z.strictObject({
        at: cf.hexa(4),
        dt: cf.hexa(2),
        mf: z.optional(cf.hexa(4)),
        min: z.number(),
        max: z.number(),
        change: z.optional(cf.hexa().or(z.number())),
      }))),
    }),
    z.strictObject({
      'bind': z.literal('groupcast'),
      'src.ep': cf.endpoint(),
      'cl': cf.hexa(4),
      'config.group': z.number(),
    }),
  ])
}
