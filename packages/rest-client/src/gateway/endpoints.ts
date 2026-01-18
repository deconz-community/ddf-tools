import { decode } from '@deconz-community/ddf-bundler'
import { Err, Ok } from 'ts-results-es'
import { z } from 'zod'
import { clientError, customError } from '../core/errors'
import { assertStatusCode, makeEndpoint, makeParameter } from '../core/helpers'
import { deviceUUIDRegex, globalParameters } from './parameters'
import { alarmSystemArmmodesRead, alarmSystemArmmodesWrite, alarmSystemSchema, alarmSystemsSchema } from './schemas/alarmSystemSchema'
import { configSchema, writableConfigSchema } from './schemas/configSchema'
import { ddfdDescriptorSchema } from './schemas/ddfSchema'
import { deviceSchema, introspectButtonEventItemSchema, introspectGenericItemSchema } from './schemas/deviceSchema'
import { groupSchema, groupsSchema, writableGroupActionSchema } from './schemas/groupSchema'
import { lightSchema, lightsSchema, writablelightStateSchema } from './schemas/lightSchema'
import { sensorSchema, sensorsSchema } from './schemas/sensorSchema'

export const endpoints = {

  // #region Discovery

  discover: makeEndpoint({
    category: 'Discovery',
    name: 'Online Gateway Discovery',
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
          internalipaddress: z.ipv4(),
          macaddress: z.string(),
          internalport: z.number(),
          name: z.string(),
          publicipaddress: z.ipv4(),
        }),
      ).transform(data => Ok(data)),
    },
  }),

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

  getAlarmSystems: makeEndpoint({
    category: 'Alarm Systems',
    name: 'Get all alarm systems',
    description: 'Returns a list of all alarm systems.',
    method: 'get',
    path: '/api/:apiKey/alarmsystems',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      schema: alarmSystemsSchema
        .transform(data => Ok(data)),
    },
  }),

  updateAlarmSystem: makeEndpoint({
    category: 'Alarm Systems',
    name: 'Update alarm system attributes',
    description: 'Sets attributes of an alarm system.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId',
    parameters: {
      apiKey: globalParameters.apiKey,
      alarmSystemId: globalParameters.alarmSystemId,
      body: makeParameter({
        description: 'Payload',
        type: 'body',
        format: 'json',
        schema: alarmSystemSchema.pick({ name: true }),
        sample: {
          name: 'New name',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/alarmsystems\/\d+\//,
      schema: alarmSystemSchema
        .pick({ name: true })
        .transform(data => Ok(data)),
    },
  }),

  updateAlarmSystemConfig: makeEndpoint({
    category: 'Alarm Systems',
    name: 'Update alarm system config',
    description: 'Sets attributes of an alarm system.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/config',
    parameters: {
      apiKey: globalParameters.apiKey,
      alarmSystemId: globalParameters.alarmSystemId,
      body: makeParameter({
        description: 'Payload',
        type: 'body',
        format: 'json',
        schema: alarmSystemSchema.shape.config.omit({
          armmode: true,
          configured: true,
        }).extend({
          code0: z.string().min(4).max(16).optional(),
        }).partial(),
        sample: () => ({
          code0: Math.random().toString(10).slice(2, 10),
          disarmed_entry_delay: 0,
          disarmed_exit_delay: 0,
          armed_away_entry_delay: 0,
          armed_away_exit_delay: 0,
          armed_away_trigger_duration: 0,
          armed_stay_entry_delay: 0,
          armed_stay_exit_delay: 0,
          armed_stay_trigger_duration: 0,
          armed_night_entry_delay: 0,
          armed_night_exit_delay: 0,
          armed_night_trigger_duration: 0,
        }),
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/alarmsystems\/\d+\/config\//,
      deconzErrors: [7],
      schema: alarmSystemSchema.shape.config.omit({ armmode: true }).partial().transform(data => Ok(data)),
    },
  }),

  updateAlarmSystemAddDevice: makeEndpoint({
    category: 'Alarm Systems',
    name: 'Add device to alarm system',
    description: 'Add keypad to alarm system.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/device/:deviceUniqueID',
    parameters: {
      apiKey: globalParameters.apiKey,
      alarmSystemId: globalParameters.alarmSystemId,
      deviceUniqueID: globalParameters.deviceUniqueID,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/alarmsystems\/\d+\/device\//,
      deconzErrors: [3, 7],
      schema: z.strictObject({
        added: z.string(),
      }).transform(data => Ok(data)),
    },
  }),

  updateAlarmSystemRemoveDevice: makeEndpoint({
    category: 'Alarm Systems',
    name: 'Remove device to alarm system',
    description: 'Removes a device from an alarm system. Note that the respective sensor or light resource is '
      + 'not deleted, only the link to the alarm system.',
    method: 'delete',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/device/:deviceUniqueID',
    parameters: {
      apiKey: globalParameters.apiKey,
      alarmSystemId: globalParameters.alarmSystemId,
      deviceUniqueID: globalParameters.deviceUniqueID,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/alarmsystems\/\d+\/device\//,
      deconzErrors: [3, 7],
      schema: z.strictObject({
        removed: z.string(),
      }).transform(data => Ok(data)),
    },
  }),

  updateAlarmSystemArmState: makeEndpoint({
    category: 'Alarm Systems',
    name: 'Update alarm system state',
    description: 'To arm or disarm an alarm system, the REST-API provides four requests, one for each mode. '
      + 'The request body is required to specify a valid code0 PIN code, which is verified to protect against '
      + 'unauthorized access.',
    method: 'put',
    path: '/api/:apiKey/alarmsystems/:alarmSystemId/:armMode',
    parameters: {
      apiKey: globalParameters.apiKey,
      alarmSystemId: globalParameters.alarmSystemId,
      armMode: makeParameter({
        description: 'Armmode to set',
        type: 'path',
        format: 'string',
        schema: alarmSystemArmmodesWrite,
        sample: 'arm_away',
      }),
      body: makeParameter({
        description: 'Payload',
        type: 'body',
        format: 'json',
        schema: z.strictObject({
          code0: z.string().min(4).max(16).optional(),
        }),
        sample: () => ({
          code0: Math.random().toString(10).slice(2, 10),
        }),
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/alarmsystems\/\d+\/config\//,
      deconzErrors: [3, 7],
      schema: z.strictObject({
        armmode: alarmSystemArmmodesRead,
      }).transform(data => Ok(data)),
    },
  }),

  // #endregion

  // #region Config endpoints

  createChallenge: makeEndpoint({
    category: 'Authentication',
    name: 'Create Challenge',
    description: 'Creates a new authentication challenge which should be used as HMAC-Sha256(challenge, install code). '
      + 'Both challenge and install code must be in lowercase hex format.',
    method: 'get',
    path: '/api/challenge',
    parameters: {},
    response: {
      format: 'json',
      schema: z.object({
        challenge: z.string().optional(),
      }).transform(result => Ok(result)),
    },
  }),

  createAPIKey: makeEndpoint({
    category: 'Authentication',
    name: 'Create API Key',
    description: 'Creates a new API key which provides authorized access to the REST-API. '
      + 'The request will only succeed if the gateway is unlocked, is having a hmac-sha256 challenge or an valid HTTP basic '
      + 'authentification credentials are provided in the HTTP request header see authorization.',
    method: 'post',
    path: '/api',
    parameters: {
      gatewayPassword: makeParameter({
        type: 'header',
        key: 'Authorization',
        format: 'string',
        description: 'Gateway password',
        schema: z.string().optional().transform(data => data ? `Basic ${btoa(`delight:${data}`)}` : undefined),
        sample: '',
      }),
      body: makeParameter({
        description: 'Payload',
        type: 'body',
        format: 'json',
        schema: z.object({
          // TODO Blacklist devicetype to avoid specific api mode
          // Should not start with iConnect | iConnectHue | Echo | hue_ | "Hue "
          'devicetype': z.string().min(0).max(40).default('REST Client'),
          'username': z.optional(z.string().min(10).max(40)),
          'hmac-sha256': z.optional(z.string()),
        }),
        sample: () => ({
          'devicetype': 'REST Client',
          'username': Math.random().toString(36).slice(2).toUpperCase(),
          'hmac-sha256': '',
        }),
      }),
    },
    response: {
      format: 'jsonArray',
      schema: z.strictObject({ username: z.string() })
        .transform(result => Ok(result))
        .describe('The generated API key.'),
    },
  }),

  deleteAPIKey: makeEndpoint({
    category: 'Authentication',
    name: 'Delete API Key',
    description: 'Deletes an API key so it can no longer be used.',
    method: 'delete',
    path: '/api/:apiKey/config/whitelist/:oldApiKey',
    parameters: {
      apiKey: globalParameters.apiKey,
      oldApiKey: makeParameter({
        type: 'path',
        format: 'string',
        description: 'Old API Key',
        knownParam: 'apiKey',
        schema: z.string().min(10).max(40),
        sample: '12345ABCDE',
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\/whitelist\//,
      schema: z.object({ value: z.string() })
        .optional()
        .transform(data => typeof data?.value === 'string'
          ? Ok(data)
          : Err(customError('delete_api_key_failed', 'Key not found.')),
        ),
    },
  }),

  getConfig: makeEndpoint({
    category: 'Config',
    name: 'Get Gateway Configuration',
    description: 'Get gateway configuration',
    method: 'get',
    path: '/api/:apiKey/config',
    parameters: {
      apiKey: globalParameters.apiKey,
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

  getFullState: makeEndpoint({
    category: 'Config',
    name: 'Get full Gateway Configuration',
    description: 'Get full gateway configuration',
    method: 'get',
    path: '/api/:apiKey',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      schema: z.object({
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
      }).transform(data => Ok(data)),
    },
  }),

  updateConfig: makeEndpoint({
    category: 'Config',
    name: 'Update Gateway Configuration',
    description: 'Modify configuration parameters.',
    method: 'put',
    path: '/api/:apiKey/config',
    parameters: {
      apiKey: globalParameters.apiKey,
      body: makeParameter({
        type: 'body',
        format: 'json',
        description: 'Properties of the gateway to update',
        schema: writableConfigSchema.partial(),
        sample: {
          name: 'New name',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: writableConfigSchema
        .partial()
        .transform(data => Ok(data)),
    },
  }),

  updateSoftware: makeEndpoint({
    category: 'System',
    name: 'Update Software',
    description: 'Starts the update if available (only on Raspberry Pi).',
    method: 'post',
    path: '/api/:apiKey/config/update',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: z.strictObject({ update: z.string() })
        .transform(data => Ok(data)),
    },
  }),

  updateFrimware: makeEndpoint({
    category: 'System',
    name: 'Update Frimware',
    description: 'Starts the update firmware process if newer version is available.',
    method: 'post',
    path: '/api/:apiKey/config/updatefirmware',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: z.strictObject({ updatefirmware: z.string() })
        .transform(data => Ok(data)),
    },
  }),

  exportConfigBackup: makeEndpoint({
    category: 'System',
    name: 'Export Configuration',
    description: 'Create a backup of the system. The exported file can be downloaded at http://[gateway]/deCONZ.tar.gz',
    method: 'post',
    path: '/api/:apiKey/config/export',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: z.strictObject({
        export: z.literal('success'),
      })
        .transform(data => Ok(data)),
    },
  }),

  importConfigBackup: makeEndpoint({
    category: 'System',
    name: 'Import configuration backup',
    description: 'Restore the backup of the system. The file need to be uploaded before with endpoint /api/fileupload',
    method: 'post',
    path: '/api/:apiKey/config/import',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: z.strictObject({
        import: z.literal('success'),
      })
        .transform(data => Ok(data)),
    },
  }),

  uploadConfigBackup: makeEndpoint({
    category: 'System',
    name: 'Upload configuration backup',
    description: 'Upload a backup of the system.',
    method: 'post',
    path: '/api/fileupload',
    parameters: {
      body: makeParameter({
        // Content-Disposition: form-data; name="file"; filename="raspbee_gateway_config_2024-01-01.dat"
        // Content-Type: application/octet-stream
        description: 'Backup file',
        format: 'blob',
        type: 'body',
        schema: z.instanceof(File),
        sample: new File([], 'raspbee_gateway_config_2024-01-01.dat'),
      }),
    },
    response: {
      format: 'blank',
      schema: z.literal('').transform(() => Ok({
        upload: 'success',
      })),
    },
  }),

  resetGateway: makeEndpoint({
    category: 'System',
    name: 'Reset the gateway',
    description: 'Reset the gateway network settings to factory new and/or delete the deCONZ database (config, lights, scenes, groups, schedules, devices, rules).',
    method: 'post',
    path: '/api/:apiKey/config/reset',
    parameters: {
      apiKey: globalParameters.apiKey,
      body: makeParameter({
        type: 'body',
        description: 'Reset options',
        format: 'json',
        schema: z.strictObject({
          resetGW: z.boolean()
            .describe('Set the network settings of the gateway to factory new.'),
          deleteDB: z.boolean()
            .describe('Delete the Database.'),
        }).partial(),
        sample: {
          resetGW: false,
          deleteDB: false,
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: z.strictObject({ reset: z.string() }).transform(data => Ok(data)),
    },
  }),

  changePassword: makeEndpoint({
    category: 'Authentication',
    name: 'Change password',
    description: 'Change the Password of the Gateway. The parameter must be a Base64 encoded string of <username>:<password>.',
    method: 'put',
    path: '/api/:apiKey/config/password',
    parameters: {
      apiKey: globalParameters.apiKey,
      body: makeParameter({
        type: 'body',
        format: 'json',
        description: 'Old and new password for the `delight` user',
        schema: z.strictObject({
          oldpassword: z.string(),
          newpassword: z.string(),
        }).transform((data) => {
          return {
            username: 'delight',
            oldhash: btoa(`delight:${data.oldpassword}`),
            newhash: btoa(`delight:${data.newpassword}`),
          }
        }),
        sample: {
          oldpassword: 'oldpassword',
          newpassword: 'newpassword',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/config\//,
      schema: z.strictObject({ password: z.string() })
        .transform(data => Ok(data)),
    },
  }),

  resetPassword: makeEndpoint({
    category: 'Authentication',
    name: 'Password reset',
    description: 'Resets the username and password to default username = "delight" and password = "delight". '
      + 'The request can only succeed within 10 minutes after gateway start.',
    method: 'delete',
    path: '/api/config/password',
    parameters: {},
    response: {
      format: 'json',
      removePrefix: /^\/api\/config\//,
      schema: z.any().transform(data => Ok(data)),
    },
  }),

  // #endregion

  // #region DDF endpoints

  downloadDDFBundleBlob: makeEndpoint({
    category: 'DDF',
    name: 'Download DDF Bundle (Blob)',
    description: 'Download a DDF bundle file',
    method: 'get',
    path: '/api/:apiKey/ddf/bundles/:hash',
    parameters: {
      apiKey: globalParameters.apiKey,
      hash: globalParameters.bundleHash,
    },
    response: {
      format: 'blob',
      schema: z.instanceof(ArrayBuffer).transform(async (data) => {
        return Ok(new Blob([data]))
      }),
    },
  }),

  downloadDDFBundleDecoded: makeEndpoint({
    category: 'DDF',
    name: 'Download DDF Bundle (Decoded)',
    description: 'Download a DDF bundle file',
    method: 'get',
    path: '/api/:apiKey/ddf/bundles/:hash',
    parameters: {
      apiKey: globalParameters.apiKey,
      hash: globalParameters.bundleHash,
    },
    response: {
      format: 'blob',
      schema: z.instanceof(ArrayBuffer).transform(async (data) => {
        try {
          return Ok(await decode(new Blob([data])))
        }
        catch (e) {
          console.error(e)
          return Err(clientError('RESPONSE_PARSE_FAILED'))
        }
      }),
    },
  }),

  getDDFBundleDescriptors: makeEndpoint({
    category: 'DDF',
    name: 'Get DDF Bundle Descriptors',
    description: 'Get all DDF bundle descriptors',
    method: 'get',
    path: '/api/:apiKey/ddf/descriptors',
    parameters: {
      apiKey: globalParameters.apiKey,
      next: makeParameter({
        type: 'query',
        key: 'next',
        format: 'string',
        description: 'The token to get the next page of results',
        schema: z.optional(z.union([z.string(), z.number()])).transform((data) => {
          if (typeof data === 'string' && data.length === 0)
            return undefined
          return data
        }),
        sample: '',
      }),
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

  uploadDDFBundle: makeEndpoint({
    category: 'DDF',
    name: 'Upload a bundle',
    description: 'Uploads a DDF bundle so it can be used by DDF system.',
    method: 'post',
    path: '/api/:apiKey/ddf/bundles',
    parameters: {
      apiKey: globalParameters.apiKey,
      body: makeParameter({
        description: 'DDF file',
        format: 'blob',
        type: 'body',
        schema: z.instanceof(File),
        sample: new File([], 'bundle.ddb'),
      }),
    },
    response: {
      format: 'blank',
      schema: z.literal('').transform(() => Ok({
        upload: 'success',
      })),
    },
  }),

  // #endregion

  // #region Devices endpoints

  getDevices: makeEndpoint({
    category: 'Devices',
    name: 'Get all devices',
    description: 'Returns a list of all devices. If there are no devices in the system an empty array [] is returned.',
    method: 'get',
    path: '/api/:apiKey/devices',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      schema: z.array(z.string()).transform(data => Ok(data)),
    },
  }),

  getDevice: makeEndpoint({
    category: 'Devices',
    name: 'Get one device',
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceUniqueID',
    parameters: {
      apiKey: globalParameters.apiKey,
      deviceUniqueID: globalParameters.deviceUniqueID,
    },
    response: {
      format: 'json',
      schema: deviceSchema.transform(data => Ok(data)),
    },
  }),

  getDeviceItemIntrospect: makeEndpoint({
    category: 'Devices',
    name: 'Introspect device item',
    description: 'Get the data type of the respective resource item as well as its defined values/boundaries or other relevant data.',
    method: 'get',
    path: '/api/:apiKey/devices/:subDeviceUniqueID/:item/introspect',
    parameters: {
      apiKey: globalParameters.apiKey,
      subDeviceUniqueID: globalParameters.subDeviceUniqueID,
      item: makeParameter({
        type: 'path',
        format: 'string',
        description: 'Item name',
        schema: z.string(),
        sample: 'attr/name',
      }),
    },
    response: {
      format: 'json',
      schema: z.preprocess((data: any) => {
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
      ])).transform(data => Ok(data)),
    },
  }),

  getDeviceDDF: makeEndpoint({
    category: 'Devices',
    name: 'Get device DDF',
    description: 'Returns the device with the specified id.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceOrSubDeviceID/ddf',
    parameters: {
      apiKey: globalParameters.apiKey,
      deviceOrSubDeviceID: globalParameters.deviceOrSubDeviceID,
    },
    response: {
      format: 'json',
      // TOTO: Add schema
      schema: z.object({}).loose().transform(data => Ok(data)),
    },
  }),

  getDeviceFullDDF: makeEndpoint({
    category: 'Devices',
    name: 'Get device full DDF',
    description: 'Returns the full DDF of the device specified by the provided MAC address.',
    method: 'get',
    path: '/api/:apiKey/devices/:deviceOrSubDeviceID/ddffull',
    parameters: {
      apiKey: globalParameters.apiKey,
      deviceOrSubDeviceID: globalParameters.deviceOrSubDeviceID,
    },
    response: {
      format: 'json',
      // TOTO: Add schema
      schema: z.object({}).loose().transform(data => Ok(data)),
    },
  }),

  reloadDeviceDDF: makeEndpoint({
    category: 'Devices',
    name: 'Reload device DDF',
    description: 'Reload the DDF for the specified device MAC address. This might be required if you made some changes.',
    method: 'get',
    path: '/api/:apiKey/devices/:subDeviceUniqueID/ddf/reload',
    parameters: {
      apiKey: globalParameters.apiKey,
      subDeviceUniqueID: globalParameters.subDeviceUniqueID,
    },
    response: {
      format: 'json',
      // TOTO: Add schema
      schema: z.object({ reload: z.string() }).transform(data => Ok(data)),
    },
  }),

  pairDevice: makeEndpoint({
    category: 'Devices',
    name: 'Pair a device with code',
    description: 'Pair a device by using zigbee install code.',
    method: 'put',
    path: '/api/:apiKey/devices/:deviceUniqueID/installcode',
    parameters: {
      apiKey: globalParameters.apiKey,
      deviceUniqueID: globalParameters.deviceUniqueID,
      body: makeParameter({
        type: 'body',
        description: 'Payload',
        format: 'json',
        schema: z.object({
          installcode: z.string()
            .describe('6, 8, 12 or 16 Byte device installation code, plus 2 Byte CRC.'),
        }),
        sample: {
          installcode: '0123456789abcdef',
        },
      }),
    },
    response: {
      format: 'json',
      schema: z.object({
        installcode: z.string()
          .describe('The device install code provided in the request.'),
        mmohash: z.string()
          .describe('The Matyas-Meyer-Oseas (MMO) hash calculated based on the provided installation code. It is automatically used by deCONZ to enable pairing with the target device.'),
      }).transform(data => Ok(data)),
    },

  }),

  setDeviceDDFPolicy: makeEndpoint({
    category: 'Devices',
    name: 'Set Device DDF Policy',
    description: 'Sets the device DDF policy and optional bundle hash to be pinned.',
    method: 'put',
    path: '/api/:apiKey/devices/:deviceUniqueID/ddf/policy',
    parameters: {
      apiKey: globalParameters.apiKey,
      deviceUniqueID: globalParameters.deviceUniqueID,
      body: makeParameter({
        type: 'body',
        format: 'json',
        description: 'Policy to set',
        schema: z.strictObject({
          policy: z.enum([
            'latest_prefer_stable',
            'latest',
            'raw_json',
            'pin',
          ]),
          hash: z.optional(z.string().length(64)),
        }),
        sample: {
          policy: 'pin',
          hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: new RegExp(`/devices(${deviceUUIDRegex})ddf/`),
      schema: z.strictObject({
        policy: z.enum([
          'latest_prefer_stable',
          'latest',
          'raw_json',
          'pin',
        ]),
        hash: z.string().optional(),
      }).transform(data => Ok(data)),
    },

  }),

  // #endregion

  // #region Groups endpoints

  createGroup: makeEndpoint({
    category: 'Groups',
    name: 'Create a group',
    description: 'Returns the group with the specified id.',
    method: 'post',
    path: '/api/:apiKey/groups',
    parameters: {
      apiKey: globalParameters.apiKey,
      body: makeParameter({
        type: 'body',
        format: 'json',
        description: 'Group properties',
        schema: groupSchema.pick({
          name: true,
          type: true,
          class: true,
          uniqueid: true,
        }),
        sample: {
          name: 'New group',
          type: 'Room',
          class: 'Living room',
          uniqueid: 'AA:BB:CC:DD',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      schema: z.strictObject({ id: z.coerce.number() })
        .transform(data => Ok(data)),
    },

  }),

  getGroups: makeEndpoint({
    category: 'Groups',
    name: 'Get all groups',
    description: 'Returns a list of all groups. If there are no groups in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/groups',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      schema: groupsSchema
        .transform(data => Ok(data)),
    },
  }),

  getGroup: makeEndpoint({
    category: 'Groups',
    name: 'Get one group',
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/:apiKey/groups/:groupId',
    parameters: {
      apiKey: globalParameters.apiKey,
      groupId: globalParameters.groupId,
    },
    response: {
      format: 'json',
      schema: groupSchema
        .transform(data => Ok(data)),
    },
  }),

  updateGroupAttr: makeEndpoint({
    category: 'Groups',
    name: 'Update group attribute',
    description: 'Sets attributes of a group which are not related to its state.',
    method: 'put',
    path: '/api/:apiKey/groups/:groupId',
    parameters: {
      apiKey: globalParameters.apiKey,
      groupId: globalParameters.groupId,
      body: makeParameter({
        type: 'body',
        format: 'json',
        description: 'Group properties',
        schema: groupSchema.pick({
          class: true,
          name: true,
          hidden: true,
          lights: true,
          lightsequence: true,
          multideviceids: true,
        }),
        sample: {
          class: 'Living room',
          name: 'New group',
          hidden: false,
          lights: ['1', '2'],
          lightsequence: [],
          multideviceids: [],
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/groups\/\d+\//,
      schema: groupSchema.pick({ name: true })
        .transform(data => Ok(data)),
    },
  }),

  updateGroupState: makeEndpoint({
    category: 'Groups',
    name: 'Update group state',
    description: 'Sets the state of a group.',
    method: 'put',
    path: '/api/:apiKey/groups/:groupId/action',
    parameters: {
      apiKey: globalParameters.apiKey,
      groupId: globalParameters.groupId,
      body: makeParameter({
        type: 'body',
        format: 'json',
        description: 'Group state',
        schema: writableGroupActionSchema,
        sample: {
          on: true,
          bri: 254,
          hue: 10000,
          sat: 254,
          effect: 'none',
          xy: [0.5, 0.5],
          ct: 250,
          alert: 'none',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/groups\/\d+\/action\//,
      schema: writableGroupActionSchema
        .transform(data => Ok(data)),
    },
  }),

  deleteGroup: makeEndpoint({
    category: 'Groups',
    name: 'Delete a group',
    description: 'Delete a group.',
    method: 'delete',
    path: '/api/:apiKey/groups/:groupId',
    parameters: {
      apiKey: globalParameters.apiKey,
      groupId: globalParameters.groupId,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/groups\/\d+\//,
      schema: z.strictObject({ id: z.coerce.number() })
        .transform(data => Ok(data)),
    },
  }),

  // #endregion

  // #region Lights endpoints

  getlights: makeEndpoint({
    category: 'Lights',
    name: 'Get all lights',
    description: 'Returns a list of all lights. If there are no lights in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/lights',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      schema: lightsSchema
        .transform(data => Ok(data)),
    },
  }),

  getlight: makeEndpoint({
    category: 'Lights',
    name: 'Get one light',
    description: 'Returns the light with the specified id.',
    method: 'get',
    path: '/api/:apiKey/lights/:lightId',
    parameters: {
      apiKey: globalParameters.apiKey,
      lightId: globalParameters.lightId,
    },
    response: {
      format: 'json',
      schema: lightSchema
        .transform(data => Ok(data)),
    },

  }),

  updateLightAttr: makeEndpoint({
    category: 'Lights',
    name: 'Update light attributes',
    description: 'Sets attributes of a light which are not related to its state.',
    method: 'put',
    path: '/api/:apiKey/lights/:lightId',
    parameters: {
      apiKey: globalParameters.apiKey,
      lightId: globalParameters.lightId,
      body: makeParameter({
        description: 'Light properties',
        format: 'json',
        type: 'body',
        schema: lightSchema.pick({
          // class: true,
          name: true,
        // hidden: true,
        // lights: true,
        // lightsequence: true,
        // multideviceids: true,
        }),
        sample: {
          name: 'New light',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/lights\/\d+\//,
      schema: lightSchema.pick({ name: true })
        .transform(data => Ok(data)),
    },
  }),

  updatelightState: makeEndpoint({
    category: 'Lights',
    name: 'Update light state',
    description: 'Sets the state of a light.',
    method: 'put',
    path: '/api/:apiKey/lights/:lightId/state',
    parameters: {
      apiKey: globalParameters.apiKey,
      lightId: globalParameters.lightId,
      body: makeParameter({
        description: 'Light state',
        format: 'json',
        type: 'body',
        schema: writablelightStateSchema,
        sample: {
          on: true,
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/lights\/\d+\/state\//,
      schema: writablelightStateSchema
        .transform(data => Ok(data)),
    },
  }),

  deletelight: makeEndpoint({
    category: 'Lights',
    name: 'Delete a light',
    description: 'Delete a light.',
    method: 'delete',
    path: '/api/:apiKey/lights/:lightId',
    parameters: {
      apiKey: globalParameters.apiKey,
      lightId: globalParameters.lightId,
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/lights\/\d+\//,
      schema: z.strictObject({ id: z.coerce.number() })
        .transform(data => Ok(data)),
    },
  }),

  // #endregion

  // #region Sensors endpoints

  createCLIPSensor: makeEndpoint({
    category: 'Sensors',
    name: 'Create a new CLIP sensor',
    description: 'Create a new CLIP sensor.',
    method: 'post',
    path: '/api/:apiKey/sensors?_query=create',
    parameters: {
      apiKey: globalParameters.apiKey,
      body: makeParameter({
        description: 'Payload',
        format: 'json',
        type: 'body',
        schema: z.object({
          name: z.string(),
          manufacturername: z.string(),
          modelid: z.string(),
          swversion: z.string(),
          type: z.string(),
          uniqueid: z.string(),
          state: z.object({
            buttonevent: z.string(),
          }),
          config: z.object({
            on: z.boolean(),
            reachable: z.boolean(),
            battery: z.number(),
          }),
        }),
        sample: {
          name: 'New Sensor',
          manufacturername: 'Manufacturer',
          modelid: 'Model',
          swversion: '1.0.0',
          type: 'CLIPSwitch',
          uniqueid: '00:1f:ee:00:00:00:08:bb-01-1000',
          state: {
            buttonevent: '1001',
          },
          config: {
            on: true,
            reachable: true,
            battery: 100,
          },

        },
      }),
    },
    response: {
      format: 'jsonArray',
      schema: z.strictObject({ id: z.coerce.number() })
        .transform(data => Ok(data)),
    },
  }),

  addSensor: makeEndpoint({
    category: 'Sensors',
    name: 'Add a new sensor',
    description: 'Open the gateway to add a new sensor.',
    method: 'post',
    path: '/api/:apiKey/sensors',
    parameters: {
      apiKey: globalParameters.apiKey,
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
    category: 'Sensors',
    name: 'Get find sensor result',
    description: 'Returns list of recently added sensors.',
    method: 'get',
    path: '/api/:apiKey/sensors/new',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      removePrefix: /^\/sensors\//,
      schema: z.preprocess((data: unknown) => {
        if (typeof data !== 'object' || data === null || !('lastscan' in data))
          return data
        const { lastscan, ...rest } = data
        const devices: { name: string, id: number }[] = []
        const sensors = z.record(z.coerce.number(), z.object({ name: z.string() })).safeParse(rest)
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

  getSensors: makeEndpoint({
    category: 'Sensors',
    name: 'Get all sensors',
    description: 'Returns a list of all sensors. If there are no sensors in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/sensors',
    parameters: {
      apiKey: globalParameters.apiKey,
    },
    response: {
      format: 'json',
      schema: sensorsSchema
        .transform(data => Ok(data)),
    },
  }),

  getSensor: makeEndpoint({
    category: 'Sensors',
    name: 'Get one sensor',
    description: 'Returns the sensor with the specified id.',
    method: 'get',
    path: '/api/:apiKey/sensors/:sensorId',
    parameters: {
      apiKey: globalParameters.apiKey,
      sensorId: globalParameters.sensorId,
    },
    response: {
      format: 'json',
      schema: sensorSchema
        .transform(data => Ok(data)),
    },
  }),

  updateSensorattr: makeEndpoint({
    category: 'Sensors',
    name: 'Update sensor attribute',
    description: 'Update a sensor with the specified parameters.',
    method: 'put',
    path: '/api/:apiKey/sensors/:sensorId',
    parameters: {
      apiKey: globalParameters.apiKey,
      sensorId: globalParameters.sensorId,
      body: makeParameter({
        description: 'Sensor properties',
        format: 'json',
        type: 'body',
        schema: sensorSchema.pick({
          name: true,
          mode: true,
        }),
        sample: {
          name: 'New sensor',
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/sensors\/\d+\//,
      schema: sensorSchema.pick({ name: true })
        .transform(data => Ok(data)),
    },
  }),

  updateSensorConfig: makeEndpoint({
    category: 'Sensors',
    name: 'Update sensor config',
    description: 'Update a sensor config with the specified parameters. Sensors expose certain configuration parameters '
      + 'depending on their defined or known capabilities. To get an overview on which parameters are available for a '
      + 'particular device, get the sensor state of either all Get all sensors or a single sensor Get sensor.',
    method: 'put',
    path: '/api/:apiKey/sensors/:sensorId/config',
    parameters: {
      apiKey: globalParameters.apiKey,
      sensorId: globalParameters.sensorId,
      body: makeParameter({
        description: 'Sensor properties',
        format: 'json',
        type: 'body',
        // TODO: Add schema
        schema: z.object({}).loose(),
        sample: {
          on: true,
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/sensors\/\d+\/config\//,
      schema: z.object({}).loose().transform(data => Ok(data)),
    },
  }),

  updateSensorState: makeEndpoint({
    category: 'Sensors',
    name: 'Update sensor state',
    description: 'Update a sensor state with the specified parameters. Changing the sensor state is only allowed for CLIP sensors.',
    method: 'put',
    path: '/api/:apiKey/sensors/:sensorId/state',
    parameters: {
      apiKey: globalParameters.apiKey,
      sensorId: globalParameters.sensorId,
      body: makeParameter({
        description: 'Sensor properties',
        format: 'json',
        type: 'body',
        // TODO: Add schema
        schema: z.object({}).loose(),
        sample: {
          buttonevent: 1001,
        },
      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/sensors\/\d+\/state\//,
      schema: z.object({}).loose().transform(data => Ok(data)),
    },
  }),

  deleteSensor: makeEndpoint({
    category: 'Sensors',
    name: 'Delete a sensor',
    description: 'Delete a sensor.',
    method: 'delete',
    path: '/api/:apiKey/sensors/:sensorId',
    parameters: {
      apiKey: globalParameters.apiKey,
      sensorId: globalParameters.sensorId,
      body: makeParameter({
        description: 'Sensor properties',
        format: 'json',
        type: 'body',
        schema: z.object({
          reset: z.boolean().optional().describe('If this parameter is omitted, it will implicitly be set to false and the sensor is marked as deleted in the database. '
            + 'If set to true, deCONZ is trying to reset the whole physical device by issuing a leave request. '
            + 'It is required that the device is awake (able to receive commands) or supports this type of request respectively and on success, '
            + 'the device is deleted as a node and reset to factory defaults.'),
        }),
        sample: {
          reset: false,
        },

      }),
    },
    response: {
      format: 'jsonArray',
      removePrefix: /^\/sensors\/\d+\//,
      schema: z.object({
        id: z.coerce.number(),
        reset: z.boolean(),
      }).partial().transform(data => Ok(data)),
    },
  }),

  // #endregion

} as const
