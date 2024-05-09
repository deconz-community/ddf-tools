import { z } from 'zod'
import { type ParameterDefinition, makeParameter } from '../core/helpers'

export const globalParameters = {
  // The API Key is optional because it's will be loaded by the API Key plugin
  apiKey: makeParameter<string>({
    description: 'API Key',
    type: 'path',
    schema: z.string(),
    sample: '12345ABCDE',
  }),

  groupId: makeParameter<number>({
    description: 'groupId',
    type: 'path',
    schema: z.number(),
    sample: 1234,
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
  deviceUniqueID: makeParameter({
    name: 'deviceUniqueID',
    description: 'Device unique ID',
    type: 'Path',
    schema: z.string().default('00:1f:ee:00:00:00:08:bb-01-1000'),
  }),
  */
} as const

/*
const IDRegex = /\d+/
const uniqueIDRegex = /[\da-f]{2}(:[\da-f]{2}){7}-[\da-f]{2}-[\da-f]{4}/
const IDorUniqueIDRegex = new RegExp(`((${IDRegex.source})|(${uniqueIDRegex.source}))`)

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
