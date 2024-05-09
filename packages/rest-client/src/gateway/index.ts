import type { ApiOf, ZodiosBodyByAlias, ZodiosHeaderParamsByAlias, ZodiosPathParamByAlias, ZodiosQueryParamsByAlias, ZodiosResponseByAlias } from '@zodios/core'
import { Zodios } from '@zodios/core'

import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import type { AxiosRequestConfig } from 'axios'
import type { ZodObject } from 'zod'
import { pluginAuth, pluginBlobResponse, pluginTransformResponse } from './plugins'
import { devicesEndpoints } from './endpoints/devicesEndpoints'
import { configEndpoints } from './endpoints/configEndpoints'
import { ddfEndpoints } from './endpoints/ddfEndpoints'
import { alarmSystemsEndpoints } from './endpoints/alarmSystemsEndpoints'
import { groupsEndpoints } from './endpoints/groupsEndpoints'
import { lightsEndpoints } from './endpoints/lightsEndpoints'
import { sensorsEndpoints } from './endpoints/sensorsEndpoints'
import type { ddfdDescriptorSchema } from './schemas/ddfSchema'

export function gatewayClient(address: string, apiKey: string, axiosConfig: AxiosRequestConfig = {}) {
  const client = new Zodios(
    address,
    [
      ...configEndpoints,
      ...ddfEndpoints,
      ...alarmSystemsEndpoints,
      ...devicesEndpoints,
      ...sensorsEndpoints,
      ...groupsEndpoints,
      ...lightsEndpoints,
    ],
    {
      axiosConfig: {
        timeout: 5000,
        ...axiosConfig,
        validateStatus: () => true,
        headers: {
          ...axiosConfig.headers,
          Accept: 'application/vnd.ddel.v1.1', // Version recommended by Manup
        },
      },
    },
  )

  client.use(pluginAuth(() => apiKey))
  client.use(pluginTransformResponse())
  client.use(pluginBlobResponse())

  return client
}

export function getParamZodSchema(alias: string, type: 'body', name: string): ZodObject<any> | undefined {
  return [
    ...configEndpoints,
    ...ddfEndpoints,
    ...alarmSystemsEndpoints,
    ...devicesEndpoints,
    ...sensorsEndpoints,
    ...groupsEndpoints,
    ...lightsEndpoints,
  ].find(endpoint => endpoint.alias === alias)?.parameters?.find(p => p.name === type)?.schema?.shape[name]
}

export type GatewayClient = ReturnType<typeof gatewayClient>
export type GatewayApi = ApiOf<GatewayClient>

export type DDFDescriptor = z.infer<typeof ddfdDescriptorSchema>

export type GatewayBodyParams<Alias extends string> = ZodiosBodyByAlias<GatewayApi, Alias>
export type GatewayHeaderParams<Alias extends string> = ZodiosHeaderParamsByAlias<GatewayApi, Alias>
export type GatewayPathParam<Alias extends string> = ZodiosPathParamByAlias<GatewayApi, Alias>
export type GatewayResponse<Alias extends string> = ZodiosResponseByAlias<GatewayApi, Alias>
export type GatewayQueryParams<Alias extends string> = ZodiosQueryParamsByAlias<GatewayApi, Alias>

interface GatewayInfo {
  gateway: GatewayClient
  uri: string
  apiKey: string
  bridgeID: string
}

export type FindGatewayResult = Result<
  (
    {
      code: 'ok'
      config: Extract<GatewayResponse<'getConfig'>['success'], { whitelist: any }>
    } |
    {
      code: 'bridge_id_mismatch' | 'invalid_api_key'
      message: string
    }
  ) & GatewayInfo,
  {
    code: 'unreachable' | 'unknown'
    message?: string
  } & Partial<Pick<GatewayInfo, 'uri' | 'apiKey'>>
>

export function findGateway(URIs: string[], apiKey = '', expectedBridgeID = ''): Promise<FindGatewayResult> {
  return new Promise((resolve) => {
    let resolved = false

    const queries = URIs.map(async (uri) => {
      try {
        const gateway = gatewayClient(uri, apiKey)
        const config = await gateway.getConfig()

        if (!config.success)
          throw new Error('No response from the gateway')

        const info: GatewayInfo = {
          gateway,
          uri,
          apiKey,
          bridgeID: config.success.bridgeid,
        }

        if (expectedBridgeID.length > 0 && config.success.bridgeid !== expectedBridgeID) {
          // Return error now but will be returned later in Ok state
          return Err({
            code: 'bridge_id_mismatch',
            message: 'Bridge ID mismatch',
            ...info,
            priority: 20,
          } as const)
        }

        if (!('whitelist' in config.success)) {
          // Return error now but will be returned later in Ok state
          return Err({
            code: 'invalid_api_key',
            message: 'Invalid API key',
            ...info,
            priority: 30,
          } as const)
        }

        resolved = true
        resolve(Ok({
          code: 'ok',
          config: config.success,
          ...info,
        }))
        return undefined
      }
      catch (e) {
        return Err({
          code: 'unreachable',
          message: 'No response from the gateway',
          uri,
          apiKey,
          priority: 10,
        } as const)
      }
    })

    Promise.allSettled(queries).then((queriesResult) => {
      if (resolved)
        return

      const result = queriesResult
        .map((result) => {
          if (result.status === 'fulfilled')
            return result.value
          return undefined
        })
        .filter(result => result !== undefined && result.isErr())
        .sort((a, b) => {
          return b!.unwrapErr().priority - a!.unwrapErr().priority
        })
        .shift()

      if (result === undefined) {
        return resolve(Err({
          code: 'unreachable',
          message: 'No response from the gateway',
        } as const))
      }

      if (result.isErr()) {
        const data = result.unwrapErr()
        if (data.code === 'invalid_api_key' || data.code === 'bridge_id_mismatch') {
          return resolve(Ok({
            code: data.code,
            message: data.message,
            gateway: data.gateway,
            uri: data.uri,
            apiKey: data.apiKey,
            bridgeID: data.bridgeID,
          }))
        }
        return resolve(Err({
          code: data.code,
          message: data.message,
          uri: data.uri,
          apiKey: data.apiKey,
        }))
      }
    })
  })
}
