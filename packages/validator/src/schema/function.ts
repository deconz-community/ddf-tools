import { z } from 'zod'
import * as cf from '../custom-formats'

export function readFunction() {
  return z.discriminatedUnion('fn', [
    z.strictObject({
      fn: z.literal('none'),
    }),
    z.strictObject({
      fn: z.undefined(),
      at: cf.hexa(4).or(z.array(cf.hexa(4))),
      cl: cf.hexa(4),
      ep: z.optional(cf.endpoint()),
      mf: z.optional(cf.hexa(4)),
      eval: z.optional(cf.javascript()),
    }),
    z.strictObject({
      fn: z.literal('zcl'),
      at: cf.hexa(4).or(z.array(cf.hexa(4))),
      cl: cf.hexa(4),
      ep: z.optional(cf.endpoint()),
      mf: z.optional(cf.hexa(4)),
      eval: z.optional(cf.javascript()),
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
      at: z.optional(cf.hexa(4)),
      cl: cf.hexa(4),
      cppsrc: z.optional(z.string()),
      ep: z.optional(cf.endpoint()),
      cmd: z.optional(cf.hexa(2)),
      mf: z.optional(cf.hexa(4)),
      eval: z.optional(cf.javascript()),
      script: z.optional(cf.filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('zcl'),
      at: z.optional(cf.hexa(4)),
      cl: cf.hexa(4),
      cppsrc: z.optional(z.string()),
      ep: z.optional(cf.endpoint()),
      cmd: z.optional(cf.hexa(2)),
      mf: z.optional(cf.hexa(4)),
      eval: z.optional(cf.javascript()),
      script: z.optional(cf.filePath()),
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
      to: cf.flatNumberStringTupleInArray(),
    }),
    z.strictObject({
      fn: z.literal('time'),
    }),
    z.strictObject({
      fn: z.literal('xiaomi:special'),
      ep: z.optional(cf.endpoint()),
      at: z.optional(cf.hexa(4)),
      idx: cf.hexa(2),
      eval: z.optional(cf.javascript()),
      script: z.optional(cf.filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('tuya'),
      dpid: z.number(),
      eval: z.optional(cf.javascript()),
      script: z.optional(cf.filePath()),
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
      'at': z.optional(cf.hexa(4).or(z.array(cf.hexa(4)))),
      'state.timeout': z.optional(z.number()),
      'change.timeout': z.optional(z.number()),
      'cl': cf.hexa(4),
      'dt': cf.hexa(2),
      'ep': z.optional(cf.endpoint()),
      'mf': z.optional(cf.hexa(4)),
      'eval': z.optional(cf.javascript()),
      'script': z.optional(cf.filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      'fn': z.literal('zcl'),
      'at': z.optional(cf.hexa(4).or(z.array(cf.hexa(4)))),
      'state.timeout': z.optional(z.number()),
      'change.timeout': z.optional(z.number()),
      'cl': cf.hexa(4),
      'dt': cf.hexa(2),
      'ep': z.optional(cf.endpoint()),
      'mf': z.optional(cf.hexa(4)),
      'eval': z.optional(cf.javascript()),
      'script': z.optional(cf.filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
    z.strictObject({
      fn: z.literal('tuya'),
      dpid: z.number(),
      dt: cf.hexa(2),
      eval: z.optional(cf.javascript()),
      script: z.optional(cf.filePath()),
    }).refine(data => !('eval' in data && 'script' in data), {
      message: 'eval and script should not both be present',
    }).innerType(),
  ])
}
