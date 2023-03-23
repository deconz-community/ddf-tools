import { z } from 'zod'
import * as cf from '../custom-formats'
import type { GenericsData } from '../types'
import { parseFunction, readFunction, writeFunction } from './function'

export function resourceSchema(_generics: GenericsData) {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('resourceitem1.schema.json'),
    'id': z.string(),
    'description': z.string(),
    'deprecated': z.optional(cf.date()),
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
