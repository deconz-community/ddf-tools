import { makeEndpoint } from '@zodios/core'
import { z } from 'zod'
import { globalParameters, globalParametersRegex } from '../parameters'
import { prepareResponse } from '../utils'
import { sensorSchema, sensorsSchema } from '../schemas/sensorSchema'

export const sensorsEndpoints = [

  makeEndpoint({
    alias: 'createSensor',
    description: 'Create a new CLIP sensor.',
    method: 'post',
    path: '/api/:apiKey/sensors?_query=create',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          name: z.string().default('New Sensor'),
          manufacturername: z.string().default('Manufacturer'),
          modelid: z.string().default('Model'),
          swversion: z.string().default('1.0.0'),
          type: z.string().default('CLIPSwitch'),
          uniqueid: z.string().default('00:1f:ee:00:00:00:08:bb-01-1000'),
          state: z.object({
            buttonevent: z.string().default('1001'),
          }),
          config: z.object({
            on: z.boolean().default(true),
            reachable: z.boolean().default(true),
            battery: z.number().default(100),
          }),
        }),
      },
    ],
  }),

  makeEndpoint({
    alias: 'findSensor',
    description: 'Find a new sensor.',
    method: 'post',
    path: '/api/:apiKey/sensors?_query=find',
    response: prepareResponse(
      z.object({
        duration: z.number(),
      }),
      {
        removePrefix: /^\/sensors\//,
      },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: z.strictObject({}),
      },
    ],
  }),

  makeEndpoint({
    alias: 'getSensorFindResult',
    description: 'Returns recently added sensors.',
    method: 'get',
    path: '/api/:apiKey/sensors/new',
    response: prepareResponse(
      z.preprocess((data: unknown) => {
        if (typeof data !== 'object' || data === null || !('lastscan' in data))
          return data
        const { lastscan, ...rest } = data
        const devices: { name: string, id: number }[] = []
        const sensors = z.record(z.object({ name: z.string() })).safeParse(rest)
        if (sensors.success) {
          Object.entries(sensors.data).forEach(([id, sensor]) => {
            devices.push({ name: sensor.name, id: Number(id) })
          })
        }
        return {
          lastscan,
          devices,
        }
      }, z.object({
        devices: z.array(z.object({
          id: z.coerce.number(),
          name: z.string(),
        })),
        lastscan: z.union([
          z.literal('none'),
          z.literal('active'),
          z.string().transform(value => new Date(value)),
        ]),
      })),
      {
        removePrefix: /^\/sensors\//,
      },
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  makeEndpoint({
    alias: 'getSensors',
    description: 'Returns a list of all sensors. If there are no sensors in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/sensors',
    response: prepareResponse(
      sensorsSchema,
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  makeEndpoint({
    alias: 'getSensor',
    description: 'Returns the sensor with the specified id.',
    method: 'get',
    path: '/api/:apiKey/sensors/:sensorId',
    response: prepareResponse(
      sensorSchema,
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.sensorId,
    ],
  }),

  makeEndpoint({
    alias: 'updateSensor',
    description: 'Update a sensor with the specified parameters.',
    method: 'put',
    path: '/api/:apiKey/sensors/:sensorId',
    response: prepareResponse(
      sensorSchema.pick({ name: true }),
      {
        removePrefix: new RegExp(`^/sensors/${globalParametersRegex.sensorId.source}/`),
      },
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.sensorId,
      {
        name: 'body',
        type: 'Body',
        schema: sensorSchema.pick({ name: true, mode: true }),
      },
    ],
  }),

  makeEndpoint({
    alias: 'updateSensorConfig',
    description: 'Update a sensor config with the specified parameters. Sensors expose certain configuration parameters '
    + 'depending on their defined or known capabilities. To get an overview on which parameters are available for a '
    + 'particular device, get the sensor state of either all Get all sensors or a single sensor Get sensor.',
    method: 'put',
    path: '/api/:apiKey/sensors/:sensorId/config',
    response: prepareResponse(
      z.object({}).passthrough(),
      {
        removePrefix: new RegExp(`^/sensors/${globalParametersRegex.sensorId.source}/config/`),
      },
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.sensorId,
      {
        name: 'body',
        type: 'Body',
        schema: z.object({}).passthrough().default({
          on: true,
        }),
      },
    ],
  }),

  makeEndpoint({
    alias: 'updateSensorState',
    description: 'Update a sensor state with the specified parameters. Changing the sensor state is only allowed for CLIP sensors.',
    method: 'put',
    path: '/api/:apiKey/sensors/:sensorId/state',
    response: prepareResponse(
      z.object({}).passthrough(),
      {
        removePrefix: new RegExp(`^/sensors/${globalParametersRegex.sensorId.source}/state/`),
      },
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.sensorId,
      {
        name: 'body',
        type: 'Body',
        schema: z.object({}).passthrough().default({
          buttonevent: 1001,
        }),
      },
    ],
  }),

  makeEndpoint({
    alias: 'deleteSensor',
    description: 'Delete a sensor.',
    method: 'delete',
    path: '/api/:apiKey/sensors/:sensorId',
    response: prepareResponse(
      // See https://github.com/dresden-elektronik/deconz-rest-doc/pull/31#issuecomment-1501970805
      z.object({
        id: z.coerce.number(),
        reset: z.boolean(),
      }).partial(),
      {
        removePrefix: new RegExp(`^/sensors/${globalParametersRegex.sensorId.source}/`),
      },
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.sensorId,
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          reset: z.boolean().optional().default(false)
            .describe('If this parameter is omitted, it will implicitly be set to false and the sensor is marked as deleted in the database. '
            + 'If set to true, deCONZ is trying to reset the whole physical device by issuing a leave request. '
            + 'It is required that the device is awake (able to receive commands) or supports this type of request respectively and on success, '
            + 'the device is deleted as a node and reset to factory defaults.'),
        }),
      },
    ],
  }),

] as const
