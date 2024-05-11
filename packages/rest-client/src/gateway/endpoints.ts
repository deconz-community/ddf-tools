import { z } from 'zod'
import { Err, Ok } from 'ts-results-es'
import { assertStatusCode, makeEndpoint, makeParameter } from '../core/helpers'
import { customError, deconzError } from '../core/errors'
import { configSchema, writableConfigSchema } from './schemas/configSchema'
import { globalParameters } from './parameters'
import { deviceSchema } from './schemas/deviceSchema'
import { ddfdDescriptorSchema } from './schemas/ddfSchema'

export const endpoints = {

  // #region Discovery

  discover: makeEndpoint({
    alias: 'discover',
    description: 'Get discovered gateways from Phoscon API',
    method: 'get',
    path: '/discover',
    baseURL: 'https://phoscon.de',
    parameters: {},
    response: {
      format: 'json',
      schema: z.array(
        z.object({
          id: z.string(),
          internalipaddress: z.string().ip(),
          macaddress: z.string(),
          internalport: z.number(),
          name: z.string(),
          publicipaddress: z.string().ip(),
        }),
      ).transform(data => Ok(data)),
    },
  }),

  /*

  updateConfig: makeEndpoint({
    description: 'Modify configuration parameters.',
    method: 'put',
    path: '/api/{:apiKey:}/config',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
      config: makeParameter({
        type: 'body',
        description: 'Properties of the gateway to update',
        schema: writableConfigSchema.partial(),
        sample: {
          name: 'New name',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      schema: writableConfigSchema
        .partial()
        .transform(data => Ok(data)),
      removePrefix: /^\/config\//,
    },
  }),

  */

  // #endregion

  // #region Alarm System endpoints

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
      globalParameters.apiKey,
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

  /*
  getAlarmSystems: makeEndpoint({
    alias: 'getAlarmSystems',
    description: 'Returns a list of all alarm systems.',
    method: 'get',
    path: '/api/:apiKey/alarmsystems',
    response: prepareResponse(
      alarmSystemsSchema,
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  updateAlarmSystem: makeEndpoint({
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
      globalParameters.apiKey,
      globalParameters.alarmSystemId,
      {
        name: 'body',
        type: 'Body',
        schema: alarmSystemSchema.pick({ name: true }),
      },
    ],
  }),

  updateAlarmSystemConfig: makeEndpoint({
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
      globalParameters.apiKey,
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

  updateAlarmSystemAddDevice: makeEndpoint({
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
      globalParameters.apiKey,
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

  updateAlarmSystemRemoveDevice: makeEndpoint({
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
      globalParameters.apiKey,
      globalParameters.alarmSystemId,
      globalParameters.deviceUniqueID,
    ],
  }),

  updateAlarmSystemArmState: makeEndpoint({
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
      globalParameters.apiKey,
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
  */

  // #endregion

  // #region Config endpoints

  /*
  createChallenge: makeEndpoint({
    alias: 'createChallenge',
    description: 'Creates a new authentication challenge which should be used as HMAC-Sha256(challenge, install code). '
    + 'Both challenge and install code must be in lowercase hex format.',
    method: 'get',
    path: '/api/challenge',
    response: prepareResponse(
      z.object({
        challenge: z.string().optional(),
      }).transform(result => result.challenge),
    ),
  }),

  createAPIKey: makeEndpoint({
    alias: 'createAPIKey',
    description: 'Creates a new API key which provides authorized access to the REST-API. '
    + 'The request will only succeed if the gateway is unlocked, is having a hmac-sha256 challenge or an valid HTTP basic '
    + 'authentification credentials are provided in the HTTP request header see authorization.',
    method: 'post',
    path: '/api',
    response: prepareResponse(
      z.strictObject({ username: z.string() }).transform(result => result.username)
        .describe('The generated API key.'),
    ),
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          // TODO Blacklist devicetype to avoid specific api mode
          // Should not start with iConnect | iConnectHue | Echo | hue_ | "Hue "
          'devicetype': z.string().min(0).max(40).default('REST Client'),
          'username': z.optional(z.string().min(10).max(40)
            .default(() => (Math.random().toString(36).slice(2).toUpperCase())),
          ),
          'hmac-sha256': z.optional(z.string()),
        }),
      },
    ],
  }),

  */
  deleteAPIKey: makeEndpoint({
    description: 'Deletes an API key so it can no longer be used.',
    method: 'delete',
    path: '/api/{:apiKey:}/config/whitelist/{:oldApiKey:}',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
      oldApiKey: makeParameter({
        type: 'path',
        description: 'Old API Key',
        schema: z.string().min(10).max(40),
        sample: '12345ABCDE',
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\/whitelist\//,
      schema: z.union([z.string(), z.boolean()]).optional()
        .transform(message => typeof message === 'string'
          ? Ok(message)
          : Err(customError('delete_api_key_failed', 'Key not found.')),
        ),
    },
  }),

  getConfig: makeEndpoint({
    description: 'Get gateway configuration',
    method: 'get',
    path: '/api/{:apiKey:}/config',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
    },
    response: {
      format: 'json',
      schema: z.preprocess((data, ctx) => {
        if (typeof data !== 'object' || data === null)
          return data

        assertStatusCode(200)(data, ctx)

        return {
          authenticated: 'whitelist' in data,
          ...data,
        }
      }, z.discriminatedUnion('authenticated', [
        configSchema.extend({
          authenticated: z.literal(true),
        }),
        configSchema.pick({
          apiversion: true,
          bridgeid: true,
          datastoreversion: true,
          devicename: true,
          factorynew: true,
          mac: true,
          modelid: true,
          name: true,
          replacesbridgeid: true,
          starterkitid: true,
          swversion: true,
        }).extend({
          authenticated: z.literal(false),
        }),
      ])).transform(data => Ok(data)),
    },
  }),

  /*

  getFullState: makeEndpoint({
    alias: 'getFullState',
    description: 'Get gateway configuration',
    method: 'get',
    path: '/api/:apiKey',
    response: prepareResponse(
      z.object({
        // TODO add schemas
        alarmsystems: z.any().describe('All alarm systems of the gateway.'),
        config: configSchema,
        groups: z.any().describe('All groups of the gateway.'),
        lights: z.any().describe('All lights of the gateway.'),
        resourcelinks: z.any().describe('All resource links of the gateway.'),
        rules: z.any().describe('All rules of the gateway.'),
        scenes: z.any().describe('All scenes of the gateway.'),
        schedules: z.any().describe('All schedules of the gateway.'),
        sensors: sensorsSchema,
      }),
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  */

  updateConfig: makeEndpoint({
    description: 'Modify configuration parameters.',
    method: 'put',
    path: '/api/{:apiKey:}/config',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
      config: makeParameter({
        type: 'body',
        description: 'Properties of the gateway to update',
        schema: writableConfigSchema.partial(),
        sample: {
          name: 'New name',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      schema: writableConfigSchema
        .partial()
        .transform(data => Ok(data)),
      removePrefix: /^\/config\//,
    },
  }),

  /*
  updateSoftware: makeEndpoint({
    alias: 'updateSoftware',
    description: 'Starts the update if available (only on Raspberry Pi).',
    method: 'post',
    path: '/api/:apiKey/config/update',
    response: prepareResponse(
      z.strictObject({ update: z.string() }).transform(result => result.update)
        .describe('The newest software version available'),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  updateFrimware: makeEndpoint({
    alias: 'updateFrimware',
    description: 'Starts the update firmware process if newer version is available.',
    method: 'post',
    path: '/api/:apiKey/config/updatefirmware',
    response: prepareResponse(
      z.strictObject({ updatefirmware: z.string() }).transform(result => result.updatefirmware)
        .describe('The newest frimware version available'),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  exportConfig: makeEndpoint({
    alias: 'exportConfig',
    description: 'Create a backup of the system. The exported file can be downloaded at http://[gateway]/deCONZ.tar.gz',
    method: 'post',
    path: '/api/:apiKey/config/export',
    response: prepareResponse(
      z.strictObject({ export: z.literal('success') }).transform(result => result.export)
        .describe('The result of the operation'),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  importConfig: makeEndpoint({
    alias: 'importConfig',
    description: 'Restore the backup of the system. The file need to be uploaded before with endpoint /api/fileupload',
    method: 'post',
    path: '/api/:apiKey/config/import',
    response: prepareResponse(
      z.strictObject({ import: z.literal('success') }).transform(result => result.import)
        .describe('The result of the operation'),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  uploadConfig: makeEndpoint({
    alias: 'uploadConfig',
    description: 'Upload a backup of the system.',
    method: 'post',
    path: '/api/fileupload',
    response: z.never(),
    parameters: [
      globalParameters.apiKey,
      {
        // Content-Disposition: form-data; name="file"; filename="raspbee_gateway_config_2024-01-01.dat"
        // Content-Type: application/octet-stream
        name: 'body',
        type: 'Body',
        schema: z.object({
          file: z.instanceof(File),
        }),
      },
    ],
  }),

  resetGateway: makeEndpoint({
    alias: 'resetGateway',
    description: 'Reset the gateway network settings to factory new and/or delete the deCONZ database (config, lights, scenes, groups, schedules, devices, rules).',
    method: 'post',
    path: '/api/:apiKey/config/reset',
    response: prepareResponse(
      z.strictObject({ reset: z.string() }).transform(result => result.reset === 'success'),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: z.strictObject({
          resetGW: z.boolean().default(false)
            .describe('Set the network settings of the gateway to factory new.'),
          deleteDB: z.boolean().default(false)
            .describe('Delete the Database.'),
        }).partial(),
      },
    ],
  }),

  changePassword: makeEndpoint({
    alias: 'changePassword',
    description: 'Change the Password of the Gateway. The parameter must be a Base64 encoded string of <username>:<password>.',
    method: 'put',
    path: '/api/:apiKey/config/password',
    response: prepareResponse(
      z.strictObject({ password: z.string() }).transform(result => result.password === 'changed'),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: z.strictObject({
          username: z.literal('delight').default('delight')
            .describe('The user name (currently only "delight" is supported).'),
          oldhash: z.string().default('')
            .describe('The Base64 encoded combination of "username:old password".'),
          newhash: z.string().default('')
            .describe('The Base64 encoded combination of "username:new password".'),
        }),
      },
    ],
  }),

  resetPassword: makeEndpoint({
    alias: 'resetPassword',
    description: 'Resets the username and password to default username = "delight" and password = "delight". '
    + 'The request can only succeed within 10 minutes after gateway start.',
    method: 'delete',
    path: '/api/config/password',
    // The REST API return nothing but the plugin pluginTransformResponse will return {success: true}
    response: prepareResponse(z.boolean()),
  }),

  */

  // #endregion

  // #region DDF endpoints

  /*
  getDDFBundle: makeEndpoint({
    alias: 'getDDFBundle',
    description: 'Get DDF bundle file',
    method: 'get',
    path: '/api/:apiKey/ddf/bundles/:hash',
    response: prepareResponse(z.instanceof(Blob)),
    reponseFormat: 'blob',
    parameters: [
      globalParameters.apiKey,
      {
        name: 'hash',
        description: 'The hash of the bundle to get',
        type: 'Path',
        schema: z.string(),
      },
    ],
  }),

  */

  getDDFBundleDescriptors: makeEndpoint({
    description: 'Get all DDF bundle descriptors',
    method: 'get',
    path: '/api/{:apiKey:}/ddf/descriptors',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
      next: {
        type: 'path',
        description: 'The token to get the next page of results',
        schema: z.optional(z.union([z.string(), z.number()])),
        sample: 3,
      },
    },
    response: {
      format: 'json',
      schema: z.preprocess((descriptors: any) => {
        if (typeof descriptors !== 'object' || descriptors === null)
          return descriptors

        // console.log({ descriptors })

        const next = descriptors.next
        if (typeof descriptors.next !== 'undefined')
          delete descriptors.next

        return {
          next,
          descriptors,
        }
      }, z.strictObject({
        next: z.optional(z.union([z.string(), z.number()])),
        descriptors: z.record(z.string(), ddfdDescriptorSchema),
      })).transform(data => Ok(data)),
    },

  }),

  // This endpoint is not implemented in the backend
  /*
  getDDFBundleDescriptor: makeEndpoint({
    description: 'Get DDF bundle descriptor',
    method: 'get',
    path: '/api/{:apiKey:}/ddf/descriptors/{:bundleHash:}',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
      bundleHash: globalParameters.bundleHash,
    },
    response: {
      format: 'json',
      schema: z.never(),
    },
  }),
  */

  /*
  uploadDDFBundle: makeEndpoint({
    alias: 'uploadDDFBundle',
    description: 'Uploads a DDF bundle so it can be used by DDF system.',
    method: 'post',
    path: '/api/:apiKey/ddf/bundles',
    response: prepareResponse(
      z.strictObject({ id: z.string() }).transform(result => result.id)
        .describe('The uploaded Bundle Hash'),
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: z.instanceof(FormData),
      },
    ],
  }),

  */
  // #endregion

  // #region Devices endpoints

  getDevices: makeEndpoint({
    description: 'Returns a list of all devices. If there are no devices in the system an empty array [] is returned.',
    method: 'get',
    path: '/api/{:apiKey:}/devices',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
    },
    response: {
      format: 'json',
      schema: z.array(z.string()).transform(data => Ok(data)),
    },
  }),

  getDevice: makeEndpoint({
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/{:apiKey:}/devices/{:deviceUniqueID:}',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
      deviceUniqueID: globalParameters.deviceUniqueID,
    },
    response: {
      format: 'json',
      schema: deviceSchema.transform(data => Ok(data)),
    },
  }),

  /*

  getDeviceItemIntrospect: makeEndpoint({
    alias: 'getDeviceItemIntrospect',
    description: 'Get the data type of the respective resource item as well as its defined values/boundaries or other relevant data.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID/:item/introspect',
    response: prepareResponse(z.preprocess((data: any) => {
      if (typeof data !== 'object' || data === null)
        return data
      if ('buttons' in data)
        data.format = 'buttons'
      else
        data.format = 'generic'
      return data
    }, z.discriminatedUnion('format', [
      introspectButtonEventItemSchema,
      introspectGenericItemSchema,
    ]))),
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

  getDeviceDDF: makeEndpoint({
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

  getDeviceFullDDF: makeEndpoint({
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

  reloadDeviceDDF: makeEndpoint({
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

  pairDevice: makeEndpoint({
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

  setDeviceDDFPolicy: makeEndpoint({
    alias: 'setDeviceDDFPolicy',
    description: 'Sets the device DDF policy and optional bundle hash to be pinned.',
    method: 'put',
    path: '/api/:apiKey/devices/:deviceUniqueID/ddf/policy',
    response: prepareResponse(
      z.strictObject({
        policy: z.enum([
          'latest_prefer_stable',
          'latest',
          'raw_json',
          'pin',
        ]),
        hash: z.string(),
      })
        .describe('The uploaded Bundle Hash'),
      {
        removePrefix: /^\/alarmsystems\/\d+\/device\//,
      },
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.deviceUniqueID,
      {
        name: 'body',
        type: 'Body',
        schema: z.discriminatedUnion('policy', [
          z.object({
            policy: z.enum([
              'latest_prefer_stable',
              'latest',
              'raw_json',
            ]),
          }),
          z.object({
            policy: z.literal('pin'),
            hash: z.string().describe('DDF bundle hash (64 characters).'),
          }),
        ]).describe('Determines how DDF bundle is selected.'),
      },
    ],
  }),

  */

  // #endregion

  // #region Groups endpoints

  /*
  createGroup: makeEndpoint({
    alias: 'createGroup',
    description: 'Returns the group with the specified id.',
    method: 'post',
    path: '/api/:apiKey/groups',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: groupSchema.pick({
          name: true,
          type: true,
          class: true,
          uniqueid: true,
        }),

      },
    ],
  }),

  getGroups: makeEndpoint({
    alias: 'getGroups',
    description: 'Returns a list of all groups. If there are no groups in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/groups',
    response: prepareResponse(
      groupsSchema,
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  getGroup: makeEndpoint({
    alias: 'getGroup',
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/:apiKey/groups/:groupId',
    response: prepareResponse(
      groupSchema,
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.groupId,
    ],
  }),

  updateGroup: makeEndpoint({
    alias: 'updateGroup',
    description: 'Sets attributes of a group which are not related to its state.',
    method: 'put',
    path: '/api/:apiKey/groups/:groupId',
    response: prepareResponse(
      groupSchema.pick({ name: true }),
      {
        removePrefix: /^\/groups\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: groupSchema.pick({
          class: true,
          name: true,
          hidden: true,
          lights: true,
          lightsequence: true,
          multideviceids: true,
        }),
      },
    ],
  }),

  updateGroupState: makeEndpoint({
    alias: 'updateGroupState',
    description: 'Sets the state of a group.',
    method: 'put',
    path: '/api/:apiKey/groups/:groupId/action',
    response: prepareResponse(
      writableGroupActionSchema,
      {
        removePrefix: /^\/groups\/\d+\/action\//,
      },
    ),
    parameters: [
      globalParameters.groupId,
      {
        name: 'body',
        type: 'Body',
        schema: writableGroupActionSchema,
      },
    ],
  }),

  deleteGroup: makeEndpoint({
    alias: 'deleteGroup',
    description: 'Delete a group.',
    method: 'delete',
    path: '/api/:apiKey/groups/:groupId',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
      {
        removePrefix: /^\/groups\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.groupId,
    ],
  }),

  // #endregion

  // #region Lights endpoints

  getlights: makeEndpoint({
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

  */
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

  /*
  updateLight: makeEndpoint({
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
  */

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

  // #endregion

  // #region Sensors endpoints

  /*
  createSensor: makeEndpoint({
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

  */

  findSensor: makeEndpoint({
    description: 'Find a new sensor.',
    method: 'post',
    path: '/api/{:apiKey:}/sensors',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/sensors\//,
      schema: z.object({
        duration: z.number(),
      }).transform(data => Ok(data)),
    },
  }),

  getSensorFindResult: makeEndpoint({
    description: 'Returns recently added sensors.',
    method: 'get',
    path: '/api/{:apiKey:}/sensors/new',
    parameters: {
      apiKey: globalParameters.optionalApiKey,
    },
    response: {
      format: 'json',
      removePrefix: /^\/sensors\//,
      schema: z.preprocess((data: unknown) => {
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
      })).transform(data => Ok(data)),
    },
  }),

  /*

  getSensors: makeEndpoint({
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

  getSensor: makeEndpoint({
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

  updateSensor: makeEndpoint({
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

  updateSensorConfig: makeEndpoint({
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

  updateSensorState: makeEndpoint({
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

  deleteSensor: makeEndpoint({
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
  */

  // #endregion

} as const
