import { makeEndpoint } from '@zodios/core'
import { z } from 'zod'
import { prepareResponse } from '../utils'
import { alarmSystemArmmodes, alarmSystemDeviceSchema, alarmSystemSchema, alarmSystemsSchema } from '../schemas/alarmSystemSchema'
import { globalParameters } from '../parameters'

export const alarmSystemsEndpoints = [

  /*
  Not implemented yet
  makeEndpoint({
    alias: 'createAlarmSystem',
    description: 'Creates a new alarm system. After creation the arm mode is set to disarmed.',
    method: 'post',
    path: '/api/:apiKey/alarmsystems',
    response: prepareResponse(
      z.strictObject({ username: z.string() }).transform(result => result.username)
        .describe('The generated API key.'),
    ),
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          name: z.string().min(0).max(40).default('New alarm system'),
        }),
      },
    ],
  }),
  */

  makeEndpoint({
    alias: 'getAlarmSystems',
    description: 'Returns a list of all alarm systems.',
    method: 'get',
    path: '/api/:apiKey/alarmsystems',
    response: prepareResponse(
      alarmSystemsSchema,
    ),
  }),

  makeEndpoint({
    alias: 'updateAlarmSystem',
    description: 'Sets attributes of an alarm system.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId',
    response: prepareResponse(
      alarmSystemSchema.pick({ name: true }),
      {
        removePrefix: /^\/alarmsystems\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.alarmSystemId,
      {
        name: 'body',
        type: 'Body',
        schema: alarmSystemSchema.pick({ name: true }),
      },
    ],
  }),

  makeEndpoint({
    alias: 'updateAlarmSystemConfig',
    description: 'Sets attributes of an alarm system.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/config',
    response: prepareResponse(
      alarmSystemSchema.shape.config
        .omit({ armmode: true })
        .partial(),
      {
        removePrefix: /^\/alarmsystems\/\d+\/config\//,
      },
    ),
    parameters: [
      globalParameters.alarmSystemId,
      {
        name: 'body',
        type: 'Body',
        schema: alarmSystemSchema.shape.config
          .omit({
            armmode: true,
            configured: true,
          })
          .extend({
            code0: z.string().min(4).max(16).optional().default(() => Math.random().toString(10).slice(2, 10)),
          })
          .partial(),
      },
    ],
  }),

  makeEndpoint({
    alias: 'updateAlarmSystemAddDevice',
    description: 'Add keypad to alarm system.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/device/:deviceUniqueID',
    response: prepareResponse(
      z.strictObject({
        added: z.string(),
      }),
      {
        removePrefix: /^\/alarmsystems\/\d+\/device\//,
      },
    ),
    parameters: [
      globalParameters.alarmSystemId,
      globalParameters.deviceUniqueID,
      {
        name: 'body',
        type: 'Body',
        schema: alarmSystemDeviceSchema
          .partial(),
      },

    ],
  }),

  makeEndpoint({
    alias: 'updateAlarmSystemRemoveDevice',
    description: 'Removes a device from an alarm system. Note that the respective sensor or light resource is '
    + 'not deleted, only the link to the alarm system.',
    method: 'delete',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/device/:deviceUniqueID',
    response: prepareResponse(
      z.strictObject({
        removed: z.string(),
      }),
      {
        removePrefix: /^\/alarmsystems\/\d+\/device\//,
      },
    ),
    parameters: [
      globalParameters.alarmSystemId,
      globalParameters.deviceUniqueID,
    ],
  }),

  makeEndpoint({
    alias: 'updateAlarmSystemArmState',
    description: 'To arm or disarm an alarm system, the REST-API provides four requests, one for each mode. '
    + 'The request body is required to specify a valid code0 PIN code, which is verified to protect against '
    + 'unauthorized access.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/:armMode',
    response: prepareResponse(
      z.strictObject({
        armmode: alarmSystemArmmodes,
      }),
      {
        removePrefix: /^\/alarmsystems\/\d+\/device\//,
      },
    ),
    parameters: [
      globalParameters.alarmSystemId,
      {
        name: 'armMode',
        description: 'Armmode to set',
        type: 'Path',
        schema: alarmSystemArmmodes,
      },
      {
        name: 'body',
        type: 'Body',
        schema: z.strictObject({
          code0: z.string().min(4).max(16).optional().default(() => Math.random().toString(10).slice(2, 10)),
        }),
      },
    ],
  }),

] as const
