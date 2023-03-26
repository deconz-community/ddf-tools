import { z } from 'zod'
import * as cf from '../custom-formats'

export function readFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.literal('none'),
    }),
    z.strictObject({
      fn: z.undefined().describe('Generic function to read ZCL attributes.'),
      at: cf.hexa(4).or(z.array(cf.hexa(4))).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code, must be set to 0x0000 for non manufacturer specific commands.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
    }),
    z.strictObject({
      fn: z.literal('zcl').describe('Generic function to read ZCL attributes.'),
      at: cf.hexa(4).or(z.array(cf.hexa(4))).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code, must be set to 0x0000 for non manufacturer specific commands.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
    }),
    z.strictObject({
      fn: z.literal('tuya').describe('Generic function to read all Tuya datapoints. It has no parameters.'),
    }),
  ]).refine(data => !('eval' in data && 'script' in data), {
    message: 'eval and script should not both be present',
  })
}

export function parseFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.undefined().describe('Generic function to parse ZCL attributes and commands.'),
      at: z.optional(cf.hexa(4)).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      cppsrc: z.optional(z.string()),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      cmd: z.optional(cf.hexa(2)).describe('Zigbee command.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code, must be set to 0x0000 for non manufacturer specific commands.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('zcl').describe('Generic function to parse ZCL attributes and commands.'),
      at: z.optional(cf.hexa(4)).describe('Attribute ID.'),
      cl: cf.hexa(4).describe('Cluster ID.'),
      cppsrc: z.optional(z.string()),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      cmd: z.optional(cf.hexa(2)).describe('Zigbee command.'),
      mf: z.optional(cf.hexa(4)).describe('Manufacturer code, must be set to 0x0000 for non manufacturer specific commands.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('ias:zonestatus').describe('Generic function to parse IAS ZONE status change notifications or zone status from read/report command.'),
      mask: z.optional(z.enum(['alarm1', 'alarm2']).or(z.literal('alarm1,alarm2'))).describe('Sets the bitmask for Alert1 and Alert2 item of the IAS Zone status.'),
    }),
    z.strictObject({
      fn: z.literal('numtostr').describe('Generic function to to convert number to string.'),
      // TODO use generic
      srcitem: z.enum(['state/airqualityppb', 'state/pm2_5']).describe('The source item holding the number.'),
      op: z.enum(['lt', 'le', 'eq', 'gt', 'ge']).describe('Comparison operator (lt | le | eq | gt | ge)'),
      to: cf.flatNumberStringTupleInArray().describe('Array of (num, string) mappings'),
    }),
    z.strictObject({
      fn: z.literal('time').describe('Specialized function to parse time, local and last set time from read/report commands of the time cluster and auto-sync time if needed.'),
    }),
    z.strictObject({
      fn: z.literal('xiaomi:special').describe('Generic function to parse custom Xiaomi attributes and commands.'),
      ep: z.optional(cf.endpoint()).describe('Endpoint, 255 means any endpoint, 0 means auto selected from subdevice.'),
      at: z.optional(cf.hexa(4)).describe('Attribute ID. The attribute to parse, shall be 0xff01, 0xff02 or 0x00f7'),
      idx: cf.hexa(2).describe('A 8-bit string hex value.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('tuya').describe('Generic function to parse Tuya data.'),
      dpid: z.number().describe('Data point ID. 1-255 the datapoint ID.'),
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
      'mf': z.optional(cf.hexa(4)).describe('Manufacturer code, must be set to 0x0000 for non manufacturer specific commands.'),
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
      'mf': z.optional(cf.hexa(4)).describe('Manufacturer code, must be set to 0x0000 for non manufacturer specific commands.'),
      'eval': z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      'script': z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
    z.strictObject({
      fn: z.literal('tuya').describe('Generic function to write Tuya data.'),
      dpid: z.number().describe('Data point ID. 1-255 the datapoint ID.'),
      dt: cf.hexa(2).describe('Data type.'),
      eval: z.optional(cf.javascript()).describe('Javascript expression to transform the raw value.'),
      script: z.optional(cf.filePath()).describe('Relative path of a Javascript .js file.'),
    }),
  ]).refine(data => !('eval' in data && 'script' in data), {
    message: 'eval and script should not both be present',
  })
}
