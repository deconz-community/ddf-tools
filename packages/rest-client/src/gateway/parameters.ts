import { z } from 'zod'
import { makeParametersObject } from '../types'

export const globalParameters = makeParametersObject({
  // The API Key is optional because it's will be loaded by the API Key plugin
  apiKey: {
    name: 'apiKey',
    description: 'API Key',
    type: 'Path',
    schema: z.string().optional(),
  },
  deviceId: {
    name: 'groupId',
    description: 'Sensor ID',
    type: 'Path',
    schema: z.number().default(1),
  },
  sensorId: {
    name: 'sensorId',
    description: 'Sensor ID',
    type: 'Path',
    schema: z.number().default(10),
  },
  alarmSystemId: {
    name: 'alarmSystemId',
    description: 'Alarm system ID',
    type: 'Path',
    schema: z.number().default(1),
  },
  deviceUniqueID: {
    name: 'deviceUniqueID',
    description: 'Device unique ID',
    type: 'Path',
    schema: z.string().default('00:1f:ee:00:00:00:08:bb-01-1000'),
  },
})

export function getParameters(...name: (keyof typeof globalParameters)[]) {
  return name.map(code => globalParameters[code])
}
