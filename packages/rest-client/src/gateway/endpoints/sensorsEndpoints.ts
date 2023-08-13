import { makeEndpoint } from '@zodios/core'
import { z } from 'zod'
import { globalParameters } from '../parameters'
import { prepareResponse } from '../utils'
import { sensorSchema, sensorsSchema } from '../schemas/sensorSchema'

export const sensorsEndpoints = [

  makeEndpoint({
    alias: 'createSensor',
    description: 'Returns the sensor with the specified id.',
    method: 'post',
    path: '/api/:apiKey/sensors',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
    ),
    parameters: [
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
    alias: 'getSensors',
    description: 'Returns a list of all sensors. If there are no sensors in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/sensors',
    response: prepareResponse(
      sensorsSchema,
    ),
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
        removePrefix: /^\/sensors\/\d+\//,
      },
    ),
    parameters: [
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
        removePrefix: /^\/sensors\/\d+\/config\//,
      },
    ),
    parameters: [
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
        removePrefix: /^\/sensors\/\d+\/state\//,
      },
    ),
    parameters: [
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
        removePrefix: /^\/sensors\/\d+\//,
      },
    ),
    parameters: [
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
