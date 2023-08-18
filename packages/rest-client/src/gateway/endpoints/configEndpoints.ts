import { z } from 'zod'
import { makeEndpoint } from '@zodios/core'
import { prepareResponse } from '../utils'
import { globalParameters } from '../parameters'
import { configSchema, writableConfigSchema } from '../schemas/configSchema'
import { sensorsSchema } from '../schemas/sensorSchema'

export const configEndpoints = [

  makeEndpoint({
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

  makeEndpoint({
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

  makeEndpoint({
    alias: 'deleteAPIKey',
    description: 'Deletes an API key so it can no longer be used.',
    method: 'delete',
    path: '/api/:apiKey/config/whitelist/:oldApiKey',
    response: prepareResponse(
      z.union([z.string(), z.boolean()]).optional()
        .transform(message => typeof message === 'string' ? message : 'Key not found.'),
      { removePrefix: /^\/config\/whitelist\// },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'oldApiKey',
        description: 'Old API Key',
        type: 'Path',
        schema: z.string().min(10).max(40),
      },
    ],
  }),

  makeEndpoint({
    alias: 'getConfig',
    description: 'Get gateway configuration',
    method: 'get',
    path: '/api/:apiKey/config',
    response: prepareResponse(
      z.union([
        configSchema,
        // For unauthenticated requests
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
        }),
      ]),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  makeEndpoint({
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

  makeEndpoint({
    alias: 'updateConfig',
    description: 'Modify configuration parameters.',
    method: 'put',
    path: '/api/:apiKey/config',
    response: prepareResponse(
      writableConfigSchema.partial(),
      { removePrefix: /^\/config\// },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: writableConfigSchema.partial(),
      },
    ],
  }),

  makeEndpoint({
    alias: 'updateSoftwate',
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

  makeEndpoint({
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

  makeEndpoint({
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

  makeEndpoint({
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

  makeEndpoint({
    alias: 'resetPassword',
    description: 'Resets the username and password to default username = "delight" and password = "delight". '
    + 'The request can only succeed within 10 minutes after gateway start.',
    method: 'delete',
    path: '/api/config/password',
    // The REST API return nothing but the plugin pluginTransformResponse will return {success: true}
    response: prepareResponse(z.boolean()),
  }),

] as const
