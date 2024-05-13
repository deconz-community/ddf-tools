import { z } from 'zod'
import { makeParameter } from '../core/helpers'

// const IDRegex = /\d+/
export const deviceUUIDRegex = /[\da-f]{2}(:[\da-f]{2}){7}/
export const subDeviceUUIDRegex = /[\da-f]{2}(:[\da-f]{2}){7}-[\da-f]{2}-[\da-f]{4}/

export const deviceOrSubDeviceUUIDRegex = new RegExp(`((${deviceUUIDRegex.source})|(${subDeviceUUIDRegex.source}))`)

// const IDorUniqueIDRegex = new RegExp(`((${IDRegex.source})|(${uniqueIDRegex.source}))`)

export const globalParameters = {
  // The API Key is optional because it's will be loaded by the API Key plugin
  apiKey: makeParameter({
    description: 'API Key',
    type: 'path',
    format: 'string',
    knownParam: 'hidden',
    schema: z.string().optional(),
    sample: '12345ABCDE',
  }),

  groupId: makeParameter({
    description: 'Group ID',
    type: 'path',
    format: 'string',
    knownParam: 'group/id',
    schema: z.number(),
    sample: 12,
  }),

  bundleHash: makeParameter({
    description: 'Hash of the bundle',
    type: 'path',
    format: 'string',
    knownParam: 'bundle/hash',
    schema: z.string().length(64),
    sample: '64ff180d340c15bb3a5136d5f336d1ca5a216ed16b1369c8439d6952478e58ac',
  }),

  sensorId: makeParameter({
    description: 'Sensor ID',
    type: 'path',
    format: 'string',
    knownParam: 'sensor/id',
    schema: z.number().or(z.string()),
    sample: '1',
  }),

  lightId: makeParameter({
    description: 'Light ID',
    type: 'path',
    format: 'string',
    knownParam: 'light/id',
    schema: z.number().or(z.string()),
    sample: '1',
  }),

  alarmSystemId: makeParameter({
    description: 'Alarm system ID',
    type: 'path',
    format: 'string',
    knownParam: 'alarmSystem/id',
    schema: z.string(),
    sample: '1',
  }),

  deviceUniqueID: makeParameter({
    description: 'Device unique ID',
    type: 'path',
    format: 'string',
    knownParam: 'device/uuid',
    schema: z.string().regex(deviceUUIDRegex),
    sample: '00:1f:ee:00:00:00:08:bb',
  }),

  subDeviceUniqueID: makeParameter({
    description: 'Sub device unique ID',
    type: 'path',
    format: 'string',
    knownParam: 'subdevice/uuid',
    schema: z.string().regex(subDeviceUUIDRegex),
    sample: '00:1f:ee:00:00:00:08:bb',
  }),

  deviceOrSubDeviceID: makeParameter({
    description: 'Device or sub device unique ID',
    type: 'path',
    format: 'string',
    knownParam: 'device/uuid',
    schema: z.string().regex(deviceOrSubDeviceUUIDRegex),
    sample: '00:1f:ee:00:00:00:08:bb',
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
