import { z } from 'zod'

export const sensorSchema = z.object({
  name: z.string()
    .describe('The name of the sensor.'),
  type: z.string()
    .describe('The type of the sensor.'),
  manufacturername: z.string().optional()
    .describe('The manufacturer name of the sensor.'),
  modelid: z.string().optional()
    .describe('The model id of the sensor.'),
  config: z.object({}).passthrough().default({})
    .describe('The config of the sensor. Refer to Change sensor config for further details.'),
  state: z.object({}).passthrough().default({})
    .describe('The state of the sensor. Refer to Change sensor state for further details.'),
  mode: z.number().optional()
    .describe('The mode of the sensor. 1 = Scenes mode 2 = Two groups mode 3 = Color temperature mode (only available for dresden elektronik Lighting Switch)'),
  etag: z.string()
    .describe('HTTP etag which changes whenever the sensor changes.'),
  uniqueid: z.string().optional()
    .describe('The unique identifiers including the MAC address of the sensor.'),
  ep: z.number().optional()
    .describe('The Endpoint of the sensor.'),
  lastseen: z.string().transform(result => new Date(result)).optional()
    .describe('Timestamp representing the last time a message from the sensor was received. UTC with resolution of minutes.'),
  swversion: z.string().optional()
    .describe('The software version of the sensor.'),
}).describe('Sensor of the gateway.')

export const sensorsSchema = z.record(sensorSchema)
  .describe('All sensors of the gateway.')
