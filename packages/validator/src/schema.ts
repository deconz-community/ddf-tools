import { z } from 'zod'
import { attributesNames, subDevicesTypes } from './consts'
import { date, endpoint, filePath, flatNumberStringTupleInArray, hexa, javascript, uuid } from './custom-formats'

export function validate(data: unknown) {
  const schema = mainSchema()
  return schema.parse(data)
}

export function mainSchema() {
  return z.discriminatedUnion('schema', [
    ddfSchema(),
    constantsSchema(),
    resourceSchema(),
    subDeviceSchema(),
  ])
}

export function ddfSchema() {
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
    'matchexpr': z.optional(javascript()),
    'path': z.optional(filePath()),
    'product': z.optional(z.string()),
    'sleeper': z.optional(z.boolean()),
    'supportsMgmtBind': z.optional(z.boolean()),
    'status': z.enum(['Draft', 'Bronze', 'Silver', 'Gold']).describe('The code quality of the DDF file.'),
    'subdevices': z.array(ddfSubDeviceSchema()),
    'bindings': z.optional(z.array(ddfBindingSchema())),
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

export function ddfSubDeviceSchema() {
  return z.strictObject({
    type: z.enum(subDevicesTypes),
    restapi: z.enum(['/lights', '/sensors']),
    uuid: uuid(),
    fingerprint: z.optional(z.strictObject({
      profile: hexa(4),
      device: hexa(4),
      endpoint: endpoint(),
      in: z.optional(z.array(hexa(4))),
      out: z.optional(z.array(hexa(4))),
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
    items: z.array(subDeviceItemSchema()),
    example: z.optional(z.unknown()),
  })
}

export function subDeviceItemSchema() {
  return z.strictObject({
    'name': z.enum(attributesNames),
    'description': z.optional(z.string()),
    'comment': z.optional(z.string()),
    'public': z.optional(z.boolean()),
    'static': z.optional(z.union([z.string(), z.number(), z.boolean()])),
    'range': z.optional(z.tuple([z.number(), z.number()])),
    'deprecated': z.optional(date()),
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

export function readFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.literal('none'),
    }),
    z.strictObject({
      fn: z.undefined(),
      at: z.optional(hexa(4).or(z.array(hexa(4)))),
      cl: hexa(4),
      ep: z.optional(endpoint()),
      mf: z.optional(hexa(4)),
      eval: z.optional(javascript()),
    }),
    z.strictObject({
      fn: z.literal('zcl'),
      at: z.optional(hexa(4).or(z.array(hexa(4)))),
      cl: hexa(4),
      ep: z.optional(endpoint()),
      mf: z.optional(hexa(4)),
      eval: z.optional(javascript()),
    }),
    z.strictObject({
      fn: z.literal('tuya'),
    }),
  ])
}

export function parseFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.undefined(),
      at: z.optional(hexa(4)),
      cl: hexa(4),
      cppsrc: z.optional(z.string()),
      ep: z.optional(endpoint()),
      cmd: z.optional(hexa(2)),
      mf: z.optional(hexa(4)),
      eval: z.optional(javascript()),
      script: z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('zcl'),
      at: z.optional(hexa(4)),
      cl: hexa(4),
      cppsrc: z.optional(z.string()),
      ep: z.optional(endpoint()),
      cmd: z.optional(hexa(2)),
      mf: z.optional(hexa(4)),
      eval: z.optional(javascript()),
      script: z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('ias:zonestatus'),
      mask: z.optional(z.enum(['alarm1', 'alarm2']).or(z.literal('alarm1,alarm2'))),
    }),
    z.strictObject({
      fn: z.literal('numtostr'),
      srcitem: z.enum(['state/airqualityppb', 'state/pm2_5']),
      op: z.literal('le'),
      to: flatNumberStringTupleInArray(),
    }),
    z.strictObject({
      fn: z.literal('time'),
    }),
    z.strictObject({
      fn: z.literal('xiaomi:special'),
      ep: z.optional(endpoint()),
      at: z.optional(hexa(4)),
      idx: hexa(2),
      eval: z.optional(javascript()),
      script: z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('tuya'),
      dpid: z.number(),
      eval: z.optional(javascript()),
      script: z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
  ])
}

export function writeFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.literal('none'),
    }),
    z.strictObject({
      'fn': z.undefined(),
      'at': z.optional(hexa(4).or(z.array(hexa(4)))),
      'state.timeout': z.optional(z.number()),
      'change.timeout': z.optional(z.number()),
      'cl': hexa(4),
      'dt': hexa(2),
      'ep': z.optional(endpoint()),
      'mf': z.optional(hexa(4)),
      'eval': z.optional(javascript()),
      'script': z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      'fn': z.literal('zcl'),
      'at': z.optional(hexa(4).or(z.array(hexa(4)))),
      'state.timeout': z.optional(z.number()),
      'change.timeout': z.optional(z.number()),
      'cl': hexa(4),
      'dt': hexa(2),
      'ep': z.optional(endpoint()),
      'mf': z.optional(hexa(4)),
      'eval': z.optional(javascript()),
      'script': z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('tuya'),
      dpid: z.number(),
      dt: hexa(2),
      eval: z.optional(javascript()),
      script: z.optional(filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
  ])
}

export function ddfBindingSchema() {
  return z.discriminatedUnion('bind', [
    z.strictObject({
      'bind': z.literal('unicast'),
      'src.ep': endpoint(),
      'dst.ep': z.optional(endpoint()),
      'cl': hexa(4),
      'report': z.optional(z.array(z.strictObject({
        at: hexa(4),
        dt: hexa(2),
        mf: z.optional(hexa(4)),
        min: z.number(),
        max: z.number(),
        change: z.optional(hexa().or(z.number())),
      }))),
    }),
    z.strictObject({
      'bind': z.literal('groupcast'),
      'src.ep': endpoint(),
      'cl': hexa(4),
      'config.group': z.number(),
    }),
  ])
}

export function constantsSchema() {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('constants1.schema.json'),
    'manufacturers': z.record(z.string().startsWith('$MF_'), z.string()),
    'device-types': z.record(z.string().startsWith('$TYPE_'), z.string()),
  })
}

export function resourceSchema() {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('resourceitem1.schema.json'),
    'id': z.string(),
    'description': z.string(),
    'deprecated': z.optional(date()),
    'datatype': z.enum(['String', 'Bool', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'Array', 'Array[3]', 'ISO 8601 timestamp']),
    'access': z.enum(['R', 'W', 'RW']),
    'public': z.boolean(),
    'implicit': z.optional(z.boolean()),
    'managed': z.optional(z.boolean()),
    'static': z.optional(z.boolean()),
    'virtual': z.optional(z.boolean()),
    'parse': z.optional(parseFunction()),
    'read': z.optional(readFunction()),
    'write': z.optional(writeFunction()),
    'refresh.interval': z.optional(z.number()),
    // TODO Validate this
    'values': z.optional(z.unknown()),
    'range': z.optional(z.tuple([z.number(), z.number()])),
    'default': z.optional(z.unknown()),
  })
}

export function subDeviceSchema() {
  return z.strictObject({
    $schema: z.optional(z.string()),
    schema: z.literal('subdevice1.schema.json'),
    type: z.enum(subDevicesTypes),
    name: z.string(),
    restapi: z.enum(['/lights', '/sensors']),
    order: z.number(),
    uuid: uuid(),
    items: z.array(z.enum(attributesNames)),
  })
}
