import { getValue } from '../core/helpers'
import type { MaybeLazy } from '../core/types'

import { endpoints } from './endpoints'

export function gatewayClient(address: MaybeLazy<string>, apiKey: MaybeLazy<string>) {
  console.log(getValue(address))
  console.log(getValue(apiKey))

  console.log(endpoints)
  /*
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
  */

  /*
  client.use(pluginAuth(() => apiKey))
  client.use(pluginTransformResponse())
  client.use(pluginBlobResponse())
  */

  return {}
}

/*
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
*/

/*
export type GatewayClient = ReturnType<typeof gatewayClient>
export type GatewayApi = ApiOf<GatewayClient>

export type DDFDescriptor = z.infer<typeof ddfdDescriptorSchema>

export type GatewayBodyParams<Alias extends string> = ZodiosBodyByAlias<GatewayApi, Alias>
export type GatewayHeaderParams<Alias extends string> = ZodiosHeaderParamsByAlias<GatewayApi, Alias>
export type GatewayPathParam<Alias extends string> = ZodiosPathParamByAlias<GatewayApi, Alias>
export type GatewayResponse<Alias extends string> = ZodiosResponseByAlias<GatewayApi, Alias>
export type GatewayQueryParams<Alias extends string> = ZodiosQueryParamsByAlias<GatewayApi, Alias>

*/

/*
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
*/
