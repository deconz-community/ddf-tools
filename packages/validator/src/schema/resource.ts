import { z } from 'zod'
import * as cf from '../custom-formats'
import type { GenericsData } from '../types'
import { parseFunction, readFunction, writeFunction } from './function'

export function resourceSchema(_generics: GenericsData) {
  return z.strictObject({
    '$schema': z.optional(z.string()),
    'schema': z.literal('resourceitem1.schema.json'),
    'id': z.string(),
    'description': z.optional(z.string())
      .describe('Item description, better to do not use it.'),
    'comment': z.optional(z.string())
      .describe('TODO: What is this ? What the difference with description ?'),
    'deprecated': z.optional(cf.date())
      .describe('Date of deprecation, if the item is deprecated, it\'s better to use the new one.'),
    'datatype': z.optional(z.enum(['String', 'Bool', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'Array', 'Array[3]', 'ISO 8601 timestamp']))
      .describe('Data type of the item.'),
    'access': z.optional(z.enum(['R', 'W', 'RW']))
      .describe('Access mode for this item, some of them are not editable.'),
    'public': z.optional(z.boolean())
      .describe('Item visible on the API.'),
    'implicit': z.optional(z.boolean())
      .describe('TODO: What is this ?'),
    'managed': z.optional(z.boolean())
      .describe('TODO: What is this ?'),
    'awake': z.optional(z.boolean())
      .describe('The device is considered awake when this item is set due a incoming command.'),
    'static': z.optional(z.union([z.string(), z.number(), z.boolean()]))
      .describe('A static default value is fixed and can be not changed.'),
    'range': z.optional(z.tuple([z.number(), z.number()]))
      .describe('Values range limit.'),
    'virtual': z.optional(z.boolean())
      .describe('TODO: What is this ?'),
    'read': z.optional(readFunction())
      .describe('Fonction used to read value.'),
    'parse': z.optional(parseFunction())
      .describe('Fonction used to parse incoming values.'),
    'write': z.optional(writeFunction())
      .describe('Fonction used to write value.'),
    'refresh.interval': z.optional(z.number())
      .describe('Refresh interval used for read fonction, NEED to be superior at value used in binding part.'),
    // TODO Validate this
    'values': z.optional(z.unknown())
      .describe('TODO: What is this ?'),
    // TODO Validate this
    'default': z.optional(z.unknown())
      .describe('Defaut value.'),
  })
}
