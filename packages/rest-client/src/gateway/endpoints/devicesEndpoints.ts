import { makeEndpoint } from '@zodios/core'
import { z } from 'zod'
import { globalParameters } from '../parameters'
import { deviceSchema, introspectButtonEventItemSchema, introspectGenericItemSchema } from '../schemas/deviceSchema'

export const devicesEndpoints = [

  makeEndpoint({
    alias: 'getDevices',
    description: 'Returns a list of all devices. If there are no devices in the system an empty array [] is returned.',
    method: 'get',
    path: '/api/:apiKey/devices',
    response: z.array(z.string()),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  makeEndpoint({
    alias: 'getDevice',
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID',
    response: deviceSchema,
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
    ],
  }),

  makeEndpoint({
    alias: 'getDeviceItemIntrospect',
    description: 'Returns the type definition of the specified item.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID/:item/introspect',
    response: z.union([
      introspectGenericItemSchema,
      introspectButtonEventItemSchema,
    ]),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
      {
        name: 'item',
        description: 'Item name',
        type: 'Path',
        schema: z.string().default('attr/name'),
      },
    ],
  }),

  makeEndpoint({
    alias: 'getDeviceDDF',
    description: 'Returns the device with the specified id.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID/ddf',
    response: z.object({}).passthrough(),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
    ],
  }),

  // /api/<apikey>/devices/<uniqueid>/[<prefix>/]<item>/introspect
] as const
