import { makeEndpoint } from '@zodios/core'
import { z } from 'zod'
import { globalParameters } from '../parameters'
import { prepareResponse } from '../utils'
import { deviceSchema, introspectButtonEventItemSchema, introspectGenericItemSchema } from '../schemas/deviceSchema'

export const devicesEndpoints = [

  makeEndpoint({
    alias: 'getDevices',
    description: 'Returns a list of all devices. If there are no devices in the system an empty array [] is returned.',
    method: 'get',
    path: '/api/:apiKey/devices',
    response: prepareResponse(z.array(z.string())),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  makeEndpoint({
    alias: 'getDevice',
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID',
    response: prepareResponse(deviceSchema),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
    ],
  }),

  makeEndpoint({
    alias: 'getDeviceItemIntrospect',
    description: 'Get the data type of the respective resource item as well as its defined values/boundaries or other relevant data.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID/:item/introspect',
    response: prepareResponse(z.union([
      introspectGenericItemSchema,
      introspectButtonEventItemSchema,
    ])),
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
    response: prepareResponse(z.object({}).passthrough()),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
    ],
  }),

  makeEndpoint({
    alias: 'getDeviceFullDDF',
    description: 'Returns the full DDF of the device specified by the provided MAC address.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID/ddffull',
    response: prepareResponse(z.object({}).passthrough()),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
    ],
  }),

  makeEndpoint({
    alias: 'reloadDeviceDDF',
    description: 'Reload the DDF for the specified device MAC address. This might be required if you made some changes.',
    method: 'put',
    path: '/api/:apiKey/devices/:deviceUniqueID/ddf/reload',
    response: prepareResponse(z.object({ reload: z.string() })),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
    ],
  }),

  makeEndpoint({
    alias: 'pairDevice',
    description: 'Pair a device by using zigbee install code.',
    method: 'put',
    path: '/api/:apiKey/devices/:deviceUniqueID/installcode',
    response: prepareResponse(z.object({
      installcode: z.string().describe('The device install code provided in the request.'),
      mmohash: z.string().describe('The Matyas-Meyer-Oseas (MMO) hash calculated based on the provided installation code. It is automatically used by deCONZ to enable pairing with the target device.'),
    })),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          installcode: z.string().describe('6, 8, 12 or 16 Byte device installation code, plus 2 Byte CRC.'),
        }),
      },
    ],
  }),

] as const
