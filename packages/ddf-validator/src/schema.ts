import { z } from 'zod'
import { subDevicesTypes } from './consts'
import { endpoint, filePath, flatNumberStringTupleInArray, hexa, javascript } from './custom-formats'

export function validate(data: unknown) {
  const schema = ddfSchema()
  return schema.parse(data)
}

export function ddfSchema() {
  return z.object({
    'schema': z.literal('devcap1.schema.json'),
    'doc:path': z.string(),
    'doc:hdr': z.string(),
    'md:known_issues': z.optional(z.array(z.string())),
    'manufacturername': z.string().or(z.array(z.string())),
    'modelid': z.string().or(z.array(z.string())),
    'vendor': z.string(),
    'product': z.string(),
    'sleeper': z.boolean(),
    'status': z.enum(['Bronze', 'Silver', 'Gold']),
    'subdevices': z.array(subDeviceSchema()),
  })
}

export function subDeviceSchema() {
  return z.object({
    type: z.enum(subDevicesTypes),
    restapi: z.enum(['/lights', '/sensors']),
    uuid: z.union([
      z.tuple([
        z.literal('$address.ext'),
        hexa(2),
      ]),
      z.tuple([
        z.literal('$address.ext'),
        hexa(2),
        hexa(4),
      ]),
    ]),
    fingerprint: z.object({
      profile: hexa(4),
      device: hexa(4),
      endpoint: hexa(4),
      in: z.optional(z.array(hexa(4))),
      out: z.optional(z.array(hexa(4))),
      items: z.array(subDeviceItemSchema()),
      example: z.optional(z.unknown()),
    }),
  })
}

export function subDeviceItemSchema() {
  return z.object({
    'name': z.string(),
    'read': z.optional(
      z.discriminatedUnion('fn', [
        z.object({
          fn: z.literal('none'),
        }),
        z.object({
          fn: z.union([z.never(), z.literal('zcl')]),
          at: hexa(4).or(z.array(hexa(4))),
          cl: hexa(4),
          ep: z.optional(endpoint()),
          mf: z.optional(hexa(4)),
          eval: z.optional(javascript()),
        }),
        z.object({
          fn: z.literal('tuya'),
        }),
      ]),
    ),
    'parse': z.optional(
      z.discriminatedUnion('fn', [
        z.object({
          fn: z.union([z.never(), z.literal('zcl')]),
          at: hexa(4),
          cl: hexa(4),
          ep: z.optional(endpoint()),
          mf: z.optional(hexa(4)),
          eval: javascript(),
          script: filePath(),
        }).refine(data => !('eval' in data && 'script' in data), {
          message: 'eval and script should not both be present',
        }).innerType(),
        z.object({
          fn: z.literal('ias:zonestatus'),
          mark: z.enum(['alarm1', 'alarm2']),
        }),
        z.object({
          fn: z.literal('numtostr'),
          srcitem: z.literal('state/airqualityppb'),
          op: z.literal('le'),
          to: flatNumberStringTupleInArray(),
        }),
        z.object({
          fn: z.literal('xiaomi:special'),
          ep: z.optional(endpoint()),
          at: z.optional(hexa(4)),
          idx: hexa(2),
          eval: javascript(),
          script: filePath(),
        }).refine(data => !('eval' in data && 'script' in data), {
          message: 'eval and script should not both be present',
        }).innerType(),
        z.object({
          fn: z.literal('tuya'),
          dpid: z.number(),
          eval: javascript(),
        }),
      ]),

    ),
    'write': z.optional(
      z.discriminatedUnion('fn', [
        z.object({
          fn: z.literal('none'),
        }),
        z.object({
          fn: z.union([z.never(), z.literal('zcl')]),
          at: hexa(4).or(z.array(hexa(4))),
          cl: hexa(4),
          dt: hexa(2),
          ep: z.optional(endpoint()),
          mf: z.optional(hexa(4)),
          eval: z.optional(javascript()),
        }),
        z.object({
          fn: z.literal('tuya'),
          dpid: z.number(),
          dt: hexa(2),
          eval: javascript(),
        }),
      ]),
    ),
    'awake': z.optional(z.boolean()),
    'default': z.optional(z.unknown()),
    'values': z.optional(z.unknown()),
    'refresh.interval': z.optional(z.number()),
  })
}
