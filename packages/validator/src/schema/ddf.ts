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
    'md:known_issues': z.optional(z.array(z.string())).describe('Know issues for this device, markdown file.'),
    'manufacturername': z.string().or(z.array(z.string())).describe('Manufacturer name from Basic Cluster.'),
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
    'name': z.enum(generics.attributes as [string, ...string[]]).describe('Item name.'),
    'description': z.optional(z.string()).describe('Item description, better to do not use it.'),
    'comment': z.optional(z.string()),
    'public': z.optional(z.boolean()).describe('Item visible on the API.'),
    'static': z.optional(z.union([z.string(), z.number(), z.boolean()])).describe('A static default value is fixed and can be not changed.'),
    'range': z.optional(z.tuple([z.number(), z.number()])).describe('Values range limit.'),
    'deprecated': z.optional(cf.date()),
    'access': z.optional(z.literal('R')).describe('Access mode for this item, some of them are not editable.'),
    'read': z.optional(readFunction()).describe('Fonction used to read value.'),
    'parse': z.optional(parseFunction()).describe('Fonction used to parse incoming values.'),
    'write': z.optional(writeFunction()).describe('Fonction used to write value.'),
    'awake': z.optional(z.boolean()).describe('The device is considered awake when this item is set due a incoming command.'),
    'default': z.optional(z.unknown()).describe('Defaut value.'),
    'values': z.optional(z.unknown()),
    'refresh.interval': z.optional(z.number()).describe('Refresh interval used for read fonction, NEED to be superior at value used in binding part.'),
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
