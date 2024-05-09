import axios from 'axios'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { getValue } from '../core/helpers'
import type { MaybeLazy } from '../core/types'

import type { EndpointAlias, ExtractFormatsSchemaForAlias, ExtractParamsForAlias } from './endpoints'
import { endpoints } from './endpoints'

const ERROR_MESSAGES = {
  NO_FORMAT: 'no format for that response',
  PARSE_FAILED: 'failed to parse data',
  NOT_IMPLEMENTED: 'format not implemented',
} as const

export type ErrorMessages = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES]

type RequestFunctionType = <
  Alias extends EndpointAlias,
  Params extends ExtractParamsForAlias<Alias>,
>(
  alias: Alias,
  params: Params
) => Promise<
  Result<
    ExtractFormatsSchemaForAlias<Alias, true>,
    ErrorMessages | ExtractFormatsSchemaForAlias<Alias, false>
  >
>

export function gatewayClient(address: MaybeLazy<string>, apiKey: MaybeLazy<string>) {
  const request: RequestFunctionType = async function (alias, params) {
    const endpoint = endpoints[alias]

    const { data, status } = await axios.request({
      method: endpoint.method,
      baseURL: getValue(address),
      url: endpoint.path,
      timeout: 5000,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      headers: {
        Accept: 'application/vnd.ddel.v1.1', // Version recommended by Manup
      },
    })

    console.log(params)

    const statusKey = `status_${status}`
    if (!(statusKey in endpoint.responseFormats))
      return Err(ERROR_MESSAGES.NO_FORMAT)

    const { format, isOk, type } = endpoint.responseFormats[statusKey as keyof typeof endpoint.responseFormats]

    switch (type) {
      case 'json': {
        const decoder = new TextDecoder('utf-8')
        const textData = decoder.decode(data)
        const jsonData = JSON.parse(textData)
        const returnData = format.safeParse(jsonData)
        if (returnData.success)
          return isOk ? Ok(returnData.data) : Err(returnData.data)
        else
          return Err(ERROR_MESSAGES.PARSE_FAILED)
      }

      default:
        return Err(ERROR_MESSAGES.NOT_IMPLEMENTED)
    }
  }

  /*
  client.use(pluginAuth(() => apiKey))
  client.use(pluginTransformResponse())
  client.use(pluginBlobResponse())
  */

  return { request }
}

function validateResponse()

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
