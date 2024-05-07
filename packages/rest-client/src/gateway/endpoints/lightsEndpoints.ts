import { makeEndpoint } from '@zodios/core'
import { globalParameters } from '../parameters'
import { lightSchema, lightsSchema } from '../schemas/lightSchema'
import { prepareResponse } from '../utils'

export const lightsEndpoints = [

  makeEndpoint({
    alias: 'getlights',
    description: 'Returns a list of all lights. If there are no lights in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/lights',
    response: prepareResponse(
      lightsSchema,
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  /*

  makeEndpoint({
    alias: 'getlight',
    description: 'Returns the light with the specified id.',
    method: 'get',
    path: '/api/:apiKey/lights/:lightId',
    response: prepareResponse(
      lightSchema,
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.lightId,
    ],
  }),

  */

  makeEndpoint({
    alias: 'updateLight',
    description: 'Sets attributes of a light which are not related to its state.',
    method: 'put',
    path: '/api/:apiKey/lights/:lightId',
    response: prepareResponse(
      lightSchema.pick({ name: true }),
      {
        removePrefix: /^\/lights\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.lightId,
      {
        name: 'body',
        type: 'Body',
        schema: lightSchema.pick({
          // class: true,
          name: true,
        // hidden: true,
        // lights: true,
        // lightsequence: true,
        // multideviceids: true,
        }),
      },
    ],
  }),

  /*
  makeEndpoint({
    alias: 'updatelightState',
    description: 'Sets the state of a light.',
    method: 'put',
    path: '/api/:apiKey/lights/:lightId/action',
    response: prepareResponse(
      writablelightActionSchema,
      {
        removePrefix: /^\/lights\/\d+\/action\//,
      },
    ),
    parameters: [
      globalParameters.lightId,
      {
        name: 'body',
        type: 'Body',
        schema: writablelightActionSchema,
      },
    ],
  }),

  makeEndpoint({
    alias: 'deletelight',
    description: 'Delete a light.',
    method: 'delete',
    path: '/api/:apiKey/lights/:lightId',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
      {
        removePrefix: /^\/lights\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.lightId,
    ],
  }),
  */

] as const
