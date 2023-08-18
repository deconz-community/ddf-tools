import { z } from 'zod'

export const deviceSchema = z.object({
  name: z.string().default('Device'),
  manufacturername: z.string().default('Manufacturer'),
  modelid: z.string().default('Model'),
  lastannounced: z.string().transform(value => new Date(value)).or(z.null())
    .describe('Last time the device announced itself to the network.'),
  lastseen: z.string().transform(value => new Date(value)).or(z.null())
    .describe('Last time the device has transmitted any data.'),
  productid: z.string().or(z.null()).optional(),
  subdevices: z.array(z.object({
    config: z.optional(z.record(z.string(), z.object({
      lastupdated: z.string().transform(value => new Date(value)).or(z.null()),
      value: z.any(),
    }))),
    state: z.optional(z.record(z.string(), z.object({
      lastupdated: z.string().transform(value => new Date(value)).or(z.null()),
      value: z.any(),
    }))),
    type: z.string(),
    uniqueid: z.string(),
  })),
  swversion: z.string().or(z.null()).describe('Firmware version.'),
  uniqueid: z.string(),
}).passthrough()

export const introspectGenericItemSchema = z.object({
  type: z.enum([
    'unknown',
    'bool',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'int8',
    'int16',
    'int32',
    'int64',
    'double',
    'string',
    'time',
    'timepattern',
  ]),
  maxval: z.number().optional(),
  minval: z.number().optional(),
})

export const introspectButtonEventItemSchema = introspectGenericItemSchema.extend({
  buttons: z.record(z.number(), z.object({
    name: z.string(),
  })),
  values: z.record(z.number(), z.object({
    button: z.number(),
    action: z.enum([
      'INITIAL_PRESS',
      'HOLD',
      'SHORT_RELEASE',
      'LONG_RELEASE',
      'DOUBLE_PRESS',
      'TREBLE_PRESS',
      'QUADRUPLE_PRESS',
      'MANY_PRESS',
      'SHAKE',
      'DROP',
      'TILT',
    ]),
  })),
})
