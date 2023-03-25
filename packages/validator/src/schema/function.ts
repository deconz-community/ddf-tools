import { z } from 'zod'
import * as cf from '../custom-formats'

export function readFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.literal('none'),
    }),
    z.strictObject({
      fn: z.undefined(),
      at: cf.hexa(4).or(z.array(cf.hexa(4))).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
    }),
    z.strictObject({
      fn: z.literal('zcl'),
      at: cf.hexa(4).or(z.array(cf.hexa(4))).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
    }),
    z.strictObject({
      fn: z.literal('tuya'),
    }),
  ]).refine(data => !('eval' in data && 'script' in data), {
    message: 'eval and script should not both be present',
  })
}

export function parseFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.undefined(),
      at: z.optional(cf.hexa(4)).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      cppsrc: z.optional(z.string()),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      cmd: z.optional(cf.hexa(2)).describe('Zigbee command.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('zcl'),
      at: z.optional(cf.hexa(4)).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      cppsrc: z.optional(z.string()),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      cmd: z.optional(cf.hexa(2)).describe('Zigbee command.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('ias:zonestatus'),
      mask: z.optional(z.enum(['alarm1', 'alarm2']).or(z.literal('alarm1,alarm2'))),
    }),
    z.strictObject({
      fn: z.literal('numtostr'),
      srcitem: z.enum(['state/airqualityppb', 'state/pm2_5']),
      op: z.literal('le'),
      to: cf.flatNumberStringTupleInArray(),
    }),
    z.strictObject({
      fn: z.literal('time'),
    }),
    z.strictObject({
      fn: z.literal('xiaomi:special'),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      at: z.optional(cf.hexa(4)).describe('Attribute ID.'),
      idx: cf.hexa(2),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('tuya'),
      dpid: z.number(),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
  ]).refine(data => !('eval' in data && 'script' in data), {
    message: 'eval and script should not both be present',
  })
}

export function writeFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.literal('none'),
    }),
    z.strictObject({
      'fn': z.undefined(),
      'at': z.optional(cf.hexa(4).or(z.array(cf.hexa(4)))).describe('Attribute ID.'),
      'state.timeout': z.optional(z.number()),
      'change.timeout': z.optional(z.number()),
      'cl': cf.hexa(4).describe('Cluster ID.'),
      'dt': cf.hexa(2).describe('Data type.'),
      'ep': z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      'mf': z.optional(cf.hexa(4)).describe('Manufacturer code.'),
      'eval': z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      'script': z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      'fn': z.literal('zcl'),
      'at': z.optional(cf.hexa(4).or(z.array(cf.hexa(4)))).describe('Attribute ID.'),
      'state.timeout': z.optional(z.number()),
      'change.timeout': z.optional(z.number()),
      'cl': cf.hexa(4).describe('Cluster ID.'),
      'dt': cf.hexa(2).describe('Data type.'),
      'ep': z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      'mf': z.optional(cf.hexa(4)).describe('Manufacturer code.'),
      'eval': z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      'script': z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('tuya'),
      dpid: z.number().describe('Data point ID.'),
      dt: cf.hexa(2).describe('Data type.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
  ]).refine(data => !('eval' in data && 'script' in data), {
    message: 'eval and script should not both be present',
  })
}
