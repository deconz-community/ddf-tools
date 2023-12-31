import type { ApiOf, ZodiosBodyByAlias, ZodiosHeaderParamsByAlias, ZodiosQueryParamsByAlias, ZodiosResponseByAlias } from '@zodios/core'
import { Zodios } from '@zodios/core'

import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import type { AxiosRequestConfig } from 'axios'
import { pluginAuth, pluginTransformResponse } from './plugins'
import { devicesEndpoints } from './endpoints/devicesEndpoints'
import { alarmSystemsEndpoints } from './endpoints/alarmSystemsEndpoints'
import { configEndpoints } from './endpoints/configEndpoints'
import { groupsEndpoints } from './endpoints/groupsEndpoints'
import { lightsEndpoints } from './endpoints/lightsEndpoints'
import { sensorsEndpoints } from './endpoints/sensorsEndpoints'

export function Gateway(address: string, apiKey: string, axiosConfig: AxiosRequestConfig = {}) {
  const client = new Zodios(
    address,
    [
      ...configEndpoints,
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

  return client
}

export type Api = ApiOf<ReturnType<typeof Gateway>>

export type BodyParams<Alias extends string> = ZodiosBodyByAlias<Api, Alias>
export type QueryParams<Alias extends string> = ZodiosQueryParamsByAlias<Api, Alias>
export type HeaderParams<Alias extends string> = ZodiosHeaderParamsByAlias<Api, Alias>
export type Response<Alias extends string> = ZodiosResponseByAlias<Api, Alias>

interface GatewayInfo {
  gateway: ReturnType<typeof Gateway>
  uri: string
  apiKey: string
  bridgeID: string
}

export type FindGatewayResult = Result<
  (
    {
      code: 'ok'
      config: Extract<Response<'getConfig'>['success'], { whitelist: any }>
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

export function FindGateway(URIs: string[], apiKey = '', expectedBridgeID = ''): Promise<FindGatewayResult> {
  return new Promise((resolve) => {
    let resolved = false

    const queries = URIs.map(async (uri) => {
      try {
        const gateway = Gateway(uri, apiKey)
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
