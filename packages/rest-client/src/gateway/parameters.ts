import { z } from 'zod'
import { makeParameter } from '../core/helpers'

const IDRegex = /\d+/
const uniqueIDRegex = /[\da-f]{2}(:[\da-f]{2}){7}-[\da-f]{2}-[\da-f]{4}/
const IDorUniqueIDRegex = new RegExp(`((${IDRegex.source})|(${uniqueIDRegex.source}))`)

export const globalParameters = {
  // The API Key is optional because it's will be loaded by the API Key plugin
  requiredApiKey: makeParameter({
    description: 'API Key',
    type: 'path',
    schema: z.string(),
    sample: '12345ABCDE',
  }),

  optionalApiKey: makeParameter({
    description: 'API Key',
    type: 'path',
    schema: z.string().optional(),
    sample: '12345ABCDE',
  }),

  // TODO: Find a better way to handle that case, the key is needed but it's added by the client
  neededApiKey: makeParameter({
    description: 'API Key',
    type: 'path',
    schema: z.string().optional(),
    sample: '12345ABCDE',
  }),

  groupId: makeParameter({
    description: 'groupId',
    type: 'path',
    schema: z.number(),
    sample: 12,
  }),

  bundleHash: makeParameter({
    description: 'Hash of the bundle',
    type: 'path',
    schema: z.string().length(64),
    sample: '64ff180d340c15bb3a5136d5f336d1ca5a216ed16b1369c8439d6952478e58ac',
  }),
  /*
  groupId: makeParameter({
    name: 'groupId',
    description: 'Device ID',
    type: 'Path',
    schema: z.number().default(1),
  }),
  sensorId: makeParameter({
    name: 'sensorId',
    description: 'Sensor ID',
    type: 'Path',
    schema: z.number().or(z.string()).default(10),
  }),
  lightId: makeParameter({
    name: 'lightId',
    description: 'Light ID',
    type: 'Path',
    schema: z.number().or(z.string()).default(10),
  }),
  alarmSystemId: makeParameter({
    name: 'alarmSystemId',
    description: 'Alarm system ID',
    type: 'Path',
    schema: z.number().default(1),
  }),
  */

  deviceUniqueID: makeParameter({
    description: 'Device unique ID',
    type: 'path',
    schema: z.string().regex(uniqueIDRegex),
    sample: '00:1f:ee:00:00:00:08:bb-01-1000',
  }),
} as const

/*
export const globalParametersRegex = {
  groupId: IDRegex,
  sensorId: IDorUniqueIDRegex,
  alarmSystemId: IDRegex,
  deviceUniqueID: uniqueIDRegex,
} as const

export function getParameters(...name: (keyof typeof globalParameters)[]) {
  return name.map(code => globalParameters[code])
}
*/
